const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');

// router.use(adminMiddleware); // Temporarily commented out to allow staff users

const db = require('../config/db');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');

// Multer config for Excel upload (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.xlsx' || ext === '.xls') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * POST /api/purchase-upload/upload
 * Upload Excel file with purchase invoice data and bulk insert.
 * Matches PHP: Uploadexcel.php / Excel_import_model
 *
 * Expected Excel columns (row 1 = headers):
 * Invoice No | Branch | Date | Vendor | Model Code | Model Name | Chassis No | Engine No | Color | Amount | Type
 */
router.post('/upload', upload.single('excelFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const isAdmin = req.user && (req.user.role == 1 || req.user.role_des === 'admin');
    const effectiveBranchId = isAdmin ? req.body.branchId : req.user.branch_id;

    if (!effectiveBranchId) {
        return res.status(400).json({ success: false, message: 'Branch selection is required' });
    }

    let conn;
    try {
        // Parse Excel
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Read as array of objects using headers on the first row
        const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Excel file is empty or has no data rows' });
        }

        conn = await db.getConnection();

        // --- PHASE 1: PRE-VALIDATION ---
        // Validate ALL rows before doing any database modifications

        // 1. Get Selected Branch Name
        const [branchResults] = await conn.execute('SELECT branch_name FROM tbl_branch WHERE b_id = ?', [effectiveBranchId]);
        if (branchResults.length === 0) {
            return res.status(400).json({ success: false, message: 'Selected branch not found in database.' });
        }
        const selectedBranchName = String(branchResults[0].branch_name || '').trim().toLowerCase();

        const chassisInFile = new Set();
        let calculatedTotal = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2; // Excel row number (accounting for header)

            // Required fields check
            const invoiceNo = String(row['Document Name'] || row['Invoice No'] || row['Supplier Invoice No'] || '').trim();
            const branchNameExcel = String(row['Branch'] || '').trim();
            const chassisNo = String(row['Chassis No'] || '').trim();
            const engineNo = String(row['Engine No'] || '').trim();
            const modelCode = String(row['Model Code'] || '').trim();
            const amount = parseFloat(row['Cost'] || row['Amount']) || 0;

            if (!invoiceNo || !branchNameExcel || !chassisNo || !engineNo || !modelCode) {
                return res.status(400).json({
                    success: false,
                    message: `Required data (Invoice No, Branch, Chassis, Engine, OR Model Code) missing at row ${rowNum}.`
                });
            }

            // 2. Strict Branch Check
            if (branchNameExcel.toLowerCase() !== selectedBranchName) {
                return res.status(400).json({
                    success: false,
                    message: `Row ${rowNum} has branch '${branchNameExcel}', but you selected '${branchResults[0].branch_name}'.`
                });
            }

            // 3. Intra-Excel Duplicate Chassis Check
            if (chassisInFile.has(chassisNo)) {
                return res.status(400).json({
                    success: false,
                    message: `Chassis number '${chassisNo}' appears multiple times in the Excel file (found again at row ${rowNum}).`
                });
            }
            chassisInFile.add(chassisNo);

            // 4. Database Duplicate Chassis Check
            const [dupChasis] = await conn.execute('SELECT chassis_no FROM purchaseitem WHERE chassis_no = ?', [chassisNo]);
            if (dupChasis.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Chassis number '${chassisNo}' (Row ${rowNum}) already exists in the system.`
                });
            }

            // Accumulate total
            calculatedTotal += amount;
        }

        // --- PHASE 2: ATOMIC EXECUTION ---
        await conn.beginTransaction();

        let successCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const invoiceNo = String(row['Document Name'] || row['Invoice No'] || row['Supplier Invoice No'] || '').trim();
            const modelCode = String(row['Model Code'] || '').trim();
            const modelName = String(row['Model'] || row['Model Name'] || '').trim();
            const chassisNo = String(row['Chassis No'] || '').trim();
            const engineNo = String(row['Engine No'] || '').trim();
            const colorCode = String(row['CCODE'] || '').trim();
            const colorName = String(row['Color'] || '').trim();
            const amount = parseFloat(row['Cost'] || row['Amount']) || 0;
            const saleType = String(row['Sale Type'] || 'Stock').trim();
            const vendorName = String(row['Vendor Name'] || row['Vendor'] || 'Bajaj Auto').trim();

            let invoiceDate = new Date();
            if (row['Document Date']) invoiceDate = new Date(row['Document Date']);
            else if (row['Date']) invoiceDate = new Date(row['Date']);
            else if (row['Supplier Invoice Date']) invoiceDate = new Date(row['Supplier Invoice Date']);

            // 1. Handle Purchase Bill
            let billId;
            const [existingBill] = await conn.execute(
                'SELECT purchaseItemBillId FROM purchaseitembill WHERE invoiceNo = ? AND purch_branchId = ?',
                [invoiceNo, effectiveBranchId]
            );

            if (existingBill.length > 0) {
                billId = existingBill[0].purchaseItemBillId;
                // Update total for this bill IF it's shared across rows (common for bulk upload)
                // Note: In bulk, we might be inserting many rows for the SAME bill.
                // We should ensure the bill total reflects the sum of its items.
                // Simple approach: Update the bill with the final calculated total if it exists.
                await conn.execute(
                    'UPDATE purchaseitembill SET total_bill_amount = ?, purc_grand_total = ? WHERE purchaseItemBillId = ?',
                    [calculatedTotal, calculatedTotal, billId]
                );
            } else {
                const [billResult] = await conn.execute(
                    `INSERT INTO purchaseitembill (invoiceNo, purch_branchId, invoiceDate, pucha_vendorName, total_bill_amount, purc_grand_total) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [invoiceNo, effectiveBranchId, invoiceDate, vendorName, calculatedTotal, calculatedTotal]
                );
                billId = billResult.insertId;
            }

            // 2. Get or Auto-add Product (Model)
            let productId = null;
            const [modelRows] = await conn.execute(
                'SELECT labour_id FROM tbl_labour_code WHERE labour_code = ?',
                [modelCode]
            );

            if (modelRows.length > 0) {
                productId = modelRows[0].labour_id;
            } else {
                const [insModel] = await conn.execute(
                    `INSERT INTO tbl_labour_code 
                    (labour_code, labour_title, discription, repair_type, fa_weight, ra_weight, oa_weight, 
                    ta_weight, ul_weight, r_weight, hp, cc, tbody, no_of_cylider, fuel, wheel_base, 
                    booking_code, seat_capacity, cgst, sgst, cess) 
                    VALUES (?, ?, ?, 'Major', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '0.00', '0.00', '0.00')`,
                    [modelCode, modelName || modelCode, modelName || modelCode]
                );
                productId = insModel.insertId;
            }

            // 3. Get or Auto-add Color
            if (colorCode) {
                const [colorRows] = await conn.execute('SELECT model_id FROM tbl_model WHERE mod_code = ?', [colorCode]);
                if (colorRows.length === 0) {
                    await conn.execute('INSERT INTO tbl_model (mod_code, mod_name) VALUES (?, ?)', [colorCode, colorName || colorCode]);
                }
            }

            // 4. Insert Purchase Item
            await conn.execute(
                `INSERT INTO purchaseitem
                (purchaseItemBillId, product_id, materialsId, materialName, chassis_no,
                lc_rate, engine_no, color_name, color_id, p_date, sale_type, branch_transfer, item_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Available')`,
                [billId, productId, modelCode, modelName, chassisNo,
                amount, engineNo, colorName, colorCode, invoiceDate, saleType, effectiveBranchId]
            );

            // 5. Update Stock
            if (productId) {
                const [stockCheck] = await conn.execute(
                    'SELECT stock_id FROM tbl_stock WHERE stock_item_id = ? AND stock_item_branch = ?',
                    [productId, effectiveBranchId]
                );
                if (stockCheck.length > 0) {
                    await conn.execute(
                        'UPDATE tbl_stock SET stock_qty = CAST(CAST(COALESCE(NULLIF(stock_qty, ""), "0") AS SIGNED) + 1 AS CHAR) WHERE stock_id = ?',
                        [stockCheck[0].stock_id]
                    );
                } else {
                    await conn.execute(
                        'INSERT INTO tbl_stock (stock_item_id, stock_item_code, stock_item_name, stock_item_branch, stock_qty, opening_stock) VALUES (?, ?, ?, ?, "1", "0")',
                        [productId, modelCode, modelName, effectiveBranchId]
                    );
                }
            }

            successCount++;
        }

        await conn.commit();
        res.json({
            success: true,
            message: `Upload successful. ${successCount} records imported. Total Bill: ${calculatedTotal.toFixed(2)}`,
            successCount,
            total: calculatedTotal
        });

    } catch (err) {
        if (conn) await conn.rollback();
        console.error('Upload Error:', err);
        res.status(500).json({ success: false, message: 'Upload failed: ' + (err.message || 'Unknown error') });
    } finally {
        if (conn) conn.release();
    }
});

/**
 * GET /api/purchase-upload/template
 * Download sample Excel template for upload.
 */
router.get('/template', (req, res) => {
    const wb = xlsx.utils.book_new();
    const headers = [
        'Document Name', 'Branch', 'Document Date', 'Vendor Name',
        'Model Code', 'Model', 'Chassis No', 'Engine No',
        'CCODE', 'Color', 'Cost', 'Sale Type'
    ];
    const sampleRow = [
        'VINV11207250', 'SARATHY MOTORS', '2026-01-01', 'Bajaj Auto',
        '00DH68', 'Pulsar 150 SD UG', 'MD2A11CX7TCK11', 'DHXCTK29425',
        'EC', 'BLACK INK BLUE', '108719.3', 'Stock'
    ];
    const ws = xlsx.utils.aoa_to_sheet([headers, sampleRow]);
    xlsx.utils.book_append_sheet(wb, ws, 'Purchase Import');
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="purchase_upload_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
});

module.exports = router;
