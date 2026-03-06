const express = require('express');
const router = express.Router();
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

    const branchId = req.body.branchId;

    try {
        // Parse Excel
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length < 2) {
            return res.status(400).json({ success: false, message: 'Excel file is empty or has no data rows' });
        }

        // Skip header row
        const dataRows = rows.slice(1);
        const errors = [];
        let successCount = 0;

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                if (!row || !row[0]) continue; // Skip empty rows

                const invoiceNo = String(row[0] || '').trim();
                const invoiceDate = row[2] ? new Date(row[2]) : new Date();
                const vendorName = String(row[3] || '').trim();
                const modelCode = String(row[4] || '').trim();
                const modelName = String(row[5] || '').trim();
                const chassisNo = String(row[6] || '').trim();
                const engineNo = String(row[7] || '').trim();
                const colorName = String(row[8] || '').trim();
                const amount = parseFloat(row[9]) || 0;
                const saleType = String(row[10] || 'Stock').trim();

                if (!chassisNo) {
                    errors.push({ row: i + 2, message: 'Chassis No is required' });
                    continue;
                }

                // Check for duplicate chassis
                const [dupChas] = await conn.execute(
                    'SELECT chassis_no FROM purchaseitem WHERE chassis_no = ?',
                    [chassisNo]
                );
                if (dupChas.length > 0) {
                    errors.push({ row: i + 2, message: `Chassis ${chassisNo} already exists` });
                    continue;
                }

                // Get or create bill
                let billId;
                const [existBill] = await conn.execute(
                    'SELECT purchaseItemBillId FROM purchaseitembill WHERE invoiceNo = ? AND purch_branchId = ?',
                    [invoiceNo, branchId]
                );

                if (existBill.length > 0) {
                    billId = existBill[0].purchaseItemBillId;
                } else {
                    const [billResult] = await conn.execute(
                        'INSERT INTO purchaseitembill (invoiceNo, purch_branchId, invoice_date, vendor_name) VALUES (?, ?, ?, ?)',
                        [invoiceNo, branchId, invoiceDate, vendorName]
                    );
                    billId = billResult.insertId;
                }

                // Get product_id by model code
                let productId = null;
                const [modelRows] = await conn.execute(
                    'SELECT model_id FROM tbl_model_details WHERE model_code = ? OR model_name = ?',
                    [modelCode, modelName]
                );
                if (modelRows.length > 0) {
                    productId = modelRows[0].model_id;
                }

                // Insert purchaseitem
                await conn.execute(
                    `INSERT INTO purchaseitem
           (purchaseItemBillId, product_id, materialsId, materialName, chassis_no,
            lc_rate, engine_no, color_name, p_date, sale_type, branch_transfer, item_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Available')`,
                    [billId, productId, modelCode, modelName, chassisNo,
                        amount, engineNo, colorName, invoiceDate, saleType, branchId]
                );

                // Update stock
                if (productId) {
                    const [stockCheck] = await conn.execute(
                        'SELECT stock_id FROM tbl_stock WHERE stock_item_id = ? AND stock_item_branch = ?',
                        [productId, branchId]
                    );
                    if (stockCheck.length > 0) {
                        await conn.execute(
                            'UPDATE tbl_stock SET stock_qty = stock_qty + 1 WHERE stock_item_id = ? AND stock_item_branch = ?',
                            [productId, branchId]
                        );
                    } else {
                        await conn.execute(
                            'INSERT INTO tbl_stock (stock_item_id, stock_item_code, stock_item_name, stock_item_branch, stock_qty, opening_stock) VALUES (?, ?, ?, ?, 1, 0)',
                            [productId, modelCode, modelName, branchId]
                        );
                    }
                }

                successCount++;
            }

            await conn.commit();
            res.json({
                success: true,
                message: `Upload complete. ${successCount} records imported.`,
                errors: errors.length > 0 ? errors : undefined,
                successCount,
                errorCount: errors.length
            });

        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
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
        'Invoice No', 'Branch', 'Date (YYYY-MM-DD)', 'Vendor Name',
        'Model Code', 'Model Name', 'Chassis No', 'Engine No',
        'Color', 'Amount', 'Sale Type'
    ];
    const sampleRow = [
        'INV001', 'BRANCH_ID', '2026-01-01', 'KTM India',
        'KTM-200', 'KTM 200 Duke', 'CH123456', 'EN123456',
        'Orange', '150000', 'Stock'
    ];
    const ws = xlsx.utils.aoa_to_sheet([headers, sampleRow]);
    xlsx.utils.book_append_sheet(wb, ws, 'Purchase Import');
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="purchase_upload_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
});

module.exports = router;
