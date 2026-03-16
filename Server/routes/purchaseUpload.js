const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');

// Apply adminMiddleware to all routes in this router
router.use(adminMiddleware);

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

    const { branchId } = req.body;
    const isAdmin = req.user && (req.user.role == 1 || req.user.role_des === 'admin');

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

        // --- PRE-VALIDATION PHASE ---
        const chassisInFile = new Set();
        const missingBranches = new Set();
        const conn = await db.getConnection();
        try {
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const rowNum = i + 2; // Excel row number (accounting for header)

                // --- FIELD CHECK ---
                const fieldsToCheck = [
                    { name: 'Document Name/Invoice No', val: row['Document Name'] || row['Invoice No'] || row['Supplier Invoice No'] },
                    { name: 'Branch', val: row['Branch'] },
                    { name: 'Document Date', val: row['Document Date'] || row['Date'] || row['Supplier Invoice Date'] },
                    { name: 'Model Code', val: row['Model Code'] },
                    { name: 'Model', val: row['Model'] || row['Model Name'] },
                    { name: 'Chassis No', val: row['Chassis No'] },
                    { name: 'Engine No', val: row['Engine No'] },
                    { name: 'CCODE', val: row['CCODE'] },
                    { name: 'Color', val: row['Color'] || row['Color Name'] },
                    { name: 'Cost', val: row['Cost'] || row['Amount'] }
                ];

                for (const field of fieldsToCheck) {
                    if (field.val === undefined || field.val === null || String(field.val).trim() === '') {
                        conn.release();
                        return res.json({
                            success: false,
                            action: 'alert',
                            message: `In this XL missed data is missing for field: '${field.name}' at row ${rowNum}. Please check your Excel file.`
                        });
                    }
                }

                const branchNameExcel = String(row['Branch'] || '').trim();
                // 1. Branch check (Collect for atomic addition)
                const [bResult] = await conn.execute('SELECT branch_id FROM tbl_branch WHERE branch_name = ?', [branchNameExcel]);
                if (bResult.length === 0) {
                    missingBranches.add(branchNameExcel);
                } else if (!isAdmin && bResult[0].branch_id != branchId) {
                    conn.release();
                    return res.json({ success: false, action: 'alert', message: `You can only enter the list for your current branch. Row ${rowNum} has branch '${branchNameExcel}'.` });
                }

                const chassisNo = String(row['Chassis No'] || '').trim();
                const colorCode = String(row['CCODE'] || '').trim();

                // 2. Chassis validation
                const [dupChas] = await conn.execute('SELECT chassis_no FROM purchaseitem WHERE chassis_no = ?', [chassisNo]);
                if (dupChas.length > 0) {
                    conn.release();
                    return res.json({ success: false, action: 'redirect_chassis', chassisNo, message: `Chassis number '${chassisNo}' is already existing in the system (Row ${rowNum}). Redirecting to Purchase Invoice page.` });
                }

                if (chassisInFile.has(chassisNo)) {
                    conn.release();
                    return res.json({ success: false, action: 'redirect_chassis', chassisNo, message: `Chassis number '${chassisNo}' appears multiple times in your Excel file (Row ${rowNum}). Redirecting to Purchase Invoice page.` });
                }
                chassisInFile.add(chassisNo);

                // 3. Color validation
                const [colorCheck] = await conn.execute('SELECT model_id FROM tbl_model WHERE mod_code = ?', [colorCode]);
                if (colorCheck.length === 0) {
                    conn.release();
                    return res.json({
                        success: false,
                        action: 'redirect_color',
                        message: `Color code ${colorCode} does not exist in system (Row ${rowNum}). Redirecting to color code adding page.`
                    });
                }
            }

            // --- EXECUTION PHASE (Strictly Atomic) ---
            await conn.beginTransaction();

            // Auto-add missing branches first
            for (const bName of missingBranches) {
                await conn.execute('INSERT INTO tbl_branch (branch_name) VALUES (?)', [bName]);
                console.log(`Auto-added missing branch inside transaction: ${bName}`);
            }

            let successCount = 0;
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];

                const branchNameExcel = String(row['Branch'] || '').trim();
                let rowBranchId = branchId;
                const [bResult] = await conn.execute('SELECT branch_id FROM tbl_branch WHERE branch_name = ?', [branchNameExcel]);
                rowBranchId = bResult[0].branch_id;

                const invoiceNo = String(row['Document Name'] || row['Invoice No'] || row['Supplier Invoice No'] || '').trim();
                let invoiceDate = new Date();
                if (row['Document Date']) invoiceDate = new Date(row['Document Date']);
                else if (row['Date']) invoiceDate = new Date(row['Date']);
                else if (row['Supplier Invoice Date']) invoiceDate = new Date(row['Supplier Invoice Date']);

                const modelCode = String(row['Model Code'] || '').trim();
                const modelName = String(row['Model'] || row['Model Name'] || '').trim();
                const chassisNo = String(row['Chassis No'] || '').trim();
                const engineNo = String(row['Engine No'] || '').trim();
                const colorCode = String(row['CCODE'] || '').trim();
                const colorName = String(row['Color'] || '').trim();
                const amount = parseFloat(row['Cost'] || row['Amount']) || 0;
                const saleType = String(row['Sale Type'] || 'Stock').trim();

                // Get or create bill
                let billId;
                const [existBill] = await conn.execute(
                    'SELECT purchaseItemBillId FROM purchaseitembill WHERE invoiceNo = ? AND purch_branchId = ?',
                    [invoiceNo, rowBranchId]
                );

                if (existBill.length > 0) {
                    billId = existBill[0].purchaseItemBillId;
                } else {
                    const [billResult] = await conn.execute(
                        'INSERT INTO purchaseitembill (invoiceNo, purch_branchId, invoiceDate, pucha_vendorName) VALUES (?, ?, ?, ?)',
                        [invoiceNo, rowBranchId, invoiceDate, 'Bajaj Auto']
                    );
                    billId = billResult.insertId;
                }

                // Model validation & auto-add
                let productId = null;
                if (modelCode || modelName) {
                    const [modelRows] = await conn.execute(
                        'SELECT model_id FROM tbl_model WHERE mod_code = ? OR mod_name = ?',
                        [modelCode, modelName]
                    );
                    if (modelRows.length > 0) {
                        productId = modelRows[0].model_id;
                    } else {
                        const [insModel] = await conn.execute(
                            'INSERT INTO tbl_model (mod_code, mod_name) VALUES (?, ?)',
                            [modelCode, modelName]
                        );
                        productId = insModel.insertId;
                    }
                }

                // Insert purchaseitem
                await conn.execute(
                    `INSERT INTO purchaseitem
           (purchaseItemBillId, product_id, materialsId, materialName, chassis_no,
            lc_rate, engine_no, color_name, color_id, p_date, sale_type, branch_transfer, item_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Available')`,
                    [billId, productId, modelCode, modelName, chassisNo,
                        amount, engineNo, colorName, colorCode, invoiceDate, saleType, rowBranchId]
                );

                // Update stock
                if (productId) {
                    const [stockCheck] = await conn.execute(
                        'SELECT stock_id FROM tbl_stock WHERE stock_item_id = ? AND stock_item_branch = ?',
                        [productId, rowBranchId]
                    );
                    if (stockCheck.length > 0) {
                        await conn.execute(
                            'UPDATE tbl_stock SET stock_qty = stock_qty + 1 WHERE stock_item_id = ? AND stock_item_branch = ?',
                            [productId, rowBranchId]
                        );
                    } else {
                        await conn.execute(
                            'INSERT INTO tbl_stock (stock_item_id, stock_item_code, stock_item_name, stock_item_branch, stock_qty, opening_stock) VALUES (?, ?, ?, ?, 1, 0)',
                            [productId, modelCode, modelName, rowBranchId]
                        );
                    }
                }

                successCount++;
            }

            await conn.commit();
            res.json({
                success: true,
                message: `Upload complete. ${successCount} records imported.`,
                successCount
            });

        } catch (err) {
            if (conn) await conn.rollback();
            throw err;
        } finally {
            if (conn) conn.release();
        }

    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ success: false, message: 'Upload failed: ' + err.message });
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
