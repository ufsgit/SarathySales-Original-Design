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
        await conn.beginTransaction();

        // --- PHASE 1: PRE-VALIDATION & COST FETCHING ---
        
        // 1. Get Selected Branch Name
        const [branchResults] = await conn.execute('SELECT branch_name FROM tbl_branch WHERE b_id = ?', [effectiveBranchId]);
        if (branchResults.length === 0) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: 'Selected branch not found in database.' });
        }
        const selectedBranchName = String(branchResults[0].branch_name || '').trim().toLowerCase();

        // Helpers
        const parseExcelDate = (dateVal) => {
            let d;
            if (!dateVal) return null;
            if (dateVal instanceof Date) d = dateVal;
            else if (typeof dateVal === 'number' || (!isNaN(dateVal) && !isNaN(parseFloat(dateVal)))) {
                const serial = parseFloat(dateVal);
                d = new Date((serial - 25569) * 86400 * 1000);
            } else {
                const s = String(dateVal).trim();
                if (!s) return null;
                const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
                if (m) d = new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
                else d = new Date(s);
            }
            if (!d || isNaN(d.getTime())) return null;
            return d.toISOString().split('T')[0];
        };

        const formatNowTime = () => {
            const now = new Date();
            let hours = now.getHours();
            const ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12 || 12;
            return `${String(hours).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}${ampm}`;
        };

        const chassisInFile = new Set();
        const invoicesInFile = new Set();
        let calculatedTotal = 0;
        
        // Store pre-fetched model info to reuse in Phase 2
        const modelCache = new Map();

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2; 
            const uiInvNo = String(req.body.invNo || '').trim();

            const invoiceNo = uiInvNo || String(row['Supplier Invoice No'] || row['Document Name'] || row['Invoice No'] || '').trim();
            const branchNameExcel = String(row['Branch'] || '').trim();
            const chassisNo = String(row['Chassis No'] || '').trim();
            const engineNo = String(row['Engine No'] || '').trim();
            const modelCode = String(row['Model Code'] || '').trim();
            const excelCost = parseFloat(row['COST'] || row['Cost'] || row['Amount'] || row['Basic Price'] || row['Basic Value'] || 0);

            if (!invoiceNo || !branchNameExcel || !chassisNo || !engineNo || !modelCode) {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Required data (Invoice No, Branch, Chassis, Engine, OR Model Code) missing at row ${rowNum}.`
                });
            }

            if (branchNameExcel.toLowerCase() !== selectedBranchName) {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Row ${rowNum} has branch '${branchNameExcel}', but you selected '${branchResults[0].branch_name}'.`
                });
            }

            if (chassisInFile.has(chassisNo)) {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Chassis number '${chassisNo}' appears multiple times in the Excel file (found again at row ${rowNum}).`
                });
            }
            chassisInFile.add(chassisNo);

            const [dupChasis] = await conn.execute('SELECT chassis_no FROM purchaseitem WHERE chassis_no = ?', [chassisNo]);
            if (dupChasis.length > 0) {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Chassis number '${chassisNo}' (Row ${rowNum}) already exists in the system.`
                });
            }

            if (!invoicesInFile.has(invoiceNo)) {
                const [dupInvoice] = await conn.execute(
                    'SELECT invoiceNo FROM purchaseitembill WHERE invoiceNo = ?',
                    [invoiceNo]
                );
                if (dupInvoice.length > 0) {
                    await conn.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Supplier Invoice No '${invoiceNo}' (found at row ${rowNum}) already exists.`
                    });
                }
                invoicesInFile.add(invoiceNo);
            }

            // Fetch model cost from DB
            if (!modelCache.has(modelCode)) {
                const [models] = await conn.execute(
                    'SELECT labour_id, purchase_cost, labour_title, hsn_code FROM tbl_labour_code WHERE labour_code = ?',
                    [modelCode]
                );
                modelCache.set(modelCode, models.length > 0 ? models[0] : null);
            }
            
            const modelInfo = modelCache.get(modelCode);
            
            if (isNaN(excelCost) || excelCost <= 0) {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Cost/Amount is missing or invalid at row ${rowNum} for Chassis '${chassisNo}'.`
                });
            }
            calculatedTotal += excelCost;
        }

        // --- PHASE 2: ATOMIC EXECUTION ---
        let successCount = 0;
        const invoicesProcessed = new Set();

        const uiBasic = Number(req.body.basicTotal || 0);
        const uiTax   = Number(req.body.taxTotal || 0);
        const uiGrand = Number(req.body.grandTotal || 0);

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const uiInvNo = String(req.body.invNo || '').trim();
            const uiInvDate = String(req.body.invoiceDate || '').trim();

            const supplierName = String(req.body.vendorName || '').trim();
            const vendorAddress = String(req.body.address || '').trim();
            const hsnCode = String(req.body.hsnCode || '').trim();
            const gstin = String(req.body.gstin || '').trim();
            const rcNo = String(req.body.rcNo || '').trim();
            const rcDate = req.body.rcDate ? parseExcelDate(req.body.rcDate) : null;

            const invoiceNo = uiInvNo || String(row['Supplier Invoice No'] || row['Document Name'] || row['Invoice No'] || '').trim();
            const invoiceDate = uiInvDate ? parseExcelDate(uiInvDate) : (parseExcelDate(row['Supplier Invoice Date'] || row['Document Date'] || row['Date']) || new Date().toISOString().split('T')[0]);
            const invoiceTime = formatNowTime();

            const modelCode = String(row['Model Code'] || '').trim();
            const modelName = String(row['Model'] || row['Model Name'] || '').trim();
            const chassisNo = String(row['Chassis No'] || '').trim();
            const engineNo = String(row['Engine No'] || '').trim();
            const colorCode = String(row['CCODE'] || '').trim();
            const colorName = String(row['Color'] || '').trim();
            const saleType = String(row['Sale Type'] || 'Stock').trim();
            const excelCost = parseFloat(row['COST'] || row['Cost'] || row['Amount'] || row['Basic Price'] || row['Basic Value'] || 0);

            const modelFamily = String(row['Model Family'] || '').trim();
            const overallAge = String(row['Over All Age'] || '').trim();
            const mfgDate = parseExcelDate(row['Mfg Date'] || '');

            // 1. Handle Purchase Bill
            let billId;
            const [existingBill] = await conn.execute(
                'SELECT purchaseItemBillId FROM purchaseitembill WHERE invoiceNo = ?',
                [invoiceNo]
            );

            if (existingBill.length > 0) {
                billId = existingBill[0].purchaseItemBillId;
                // Update totals for this bill once per upload run
                if (!invoicesProcessed.has(invoiceNo)) {
                    await conn.execute(
                        `UPDATE purchaseitembill SET 
                            total_bill_amount = ?, purc_basic_total = ?, 
                            purc_tax_total = ?, purc_grand_total = ? 
                         WHERE purchaseItemBillId = ?`,
                        [calculatedTotal, uiBasic, uiTax, uiGrand, billId]
                    );
                    invoicesProcessed.add(invoiceNo);
                }
            } else {
                const [billResult] = await conn.execute(
                    `INSERT INTO purchaseitembill (
                        invoiceNo, purch_branchId, invoiceDate, invoiceTime, pucha_vendorName, purcha_vend_addrs,
                        rc_no, rac_date, hsn_code, purc_gstin, bill_status, 
                        purc_basic_total, purc_tax_total, purc_grand_total, total_bill_amount
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
                    [
                        invoiceNo, effectiveBranchId, invoiceDate, invoiceTime, supplierName, vendorAddress,
                        rcNo, rcDate, hsnCode, gstin,
                        uiBasic, uiTax, uiGrand, calculatedTotal
                    ]
                );
                billId = billResult.insertId;
                invoicesProcessed.add(invoiceNo);
            }

            // 2. Get or Auto-add Product (Model)
            let productId = null;
            const modelInfo = modelCache.get(modelCode);

            if (modelInfo) {
                productId = modelInfo.labour_id;
                // NO UPDATE for existing models as per requirement
            } else {
                // New Model: Insert with excelCost as purchase_cost and default empty values for mandatory metadata
                const [insModel] = await conn.execute(
                    `INSERT INTO tbl_labour_code 
                    (labour_code, labour_title, discription, repair_type, hsn_code,
                    fa_weight, ra_weight, oa_weight, ta_weight, ul_weight, r_weight, hp, cc, tbody, no_of_cylider, fuel, wheel_base, booking_code, seat_capacity,
                    sale_price, purchase_cost, cgst, sgst, total_price, cess) 
                    VALUES (?, ?, ?, 'Major', ?, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '0.00', ?, '0.00', '0.00', '0.00', '0.00')`,
                    [modelCode, modelName || modelCode, modelName || modelCode, String(row['HSN Code'] || '').trim(), excelCost.toFixed(2)]
                );
                productId = insModel.insertId;
                // Re-fetch to satisfy cache for subsequent rows of same new model
                modelCache.set(modelCode, { labour_id: productId, purchase_cost: excelCost });
            }

            // 3. Get or Auto-add Color
            if (colorCode) {
                const [colorRows] = await conn.execute('SELECT model_id FROM tbl_model WHERE mod_code = ?', [colorCode]);
                if (colorRows.length === 0) {
                    await conn.execute('INSERT INTO tbl_model (mod_code, mod_name) VALUES (?, ?)', [colorCode, colorName || colorCode]);
                }
            }

            const itemHsnCode = String(row['HSN Code'] || modelInfo?.hsn_code || '').trim();
            const itemCost = excelCost;

            // 4. Insert Purchase Item
            await conn.execute(
                `INSERT INTO purchaseitem
                (purchaseItemBillId, product_id, materialsId, materialName, chassis_no,
                lc_rate, engine_no, color_name, color_id, p_date, sale_type, model_family, item_hsn_code, overall_age, branch_transfer, item_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Available')`,
                [billId, productId, modelCode, modelName, chassisNo,
                itemCost, engineNo, colorName, colorCode, mfgDate, saleType, modelFamily, itemHsnCode, overallAge, effectiveBranchId]
            );

            // 5. Update Stock
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

            successCount++;
        }

        await conn.commit();
        res.json({
            success: true,
            message: `Upload successful. ${successCount} records imported. Bill Total: ${calculatedTotal.toFixed(2)}`,
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
