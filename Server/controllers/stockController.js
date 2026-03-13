const db = require('../config/db');
const path = require('path');
const ExcelJS = require('exceljs');


const getStockList = async (req, res) => {
    let branchId = req.query.branchId;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    try {
        let sql = `SELECT tbl_stock.*, tbl_branch.branch_name FROM tbl_stock
                   LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_stock.stock_item_branch`;
        let countSql = `SELECT COUNT(*) as total FROM tbl_stock`;
        let params = [];
        let countParams = [];

        if (branchId) {
            sql += ` WHERE tbl_stock.stock_item_branch = ?`;
            countSql += ` WHERE tbl_stock.stock_item_branch = ?`;
            params.push(branchId);
            countParams.push(branchId);
        }

        sql += ` ORDER BY tbl_stock.stock_id DESC LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await db.execute(sql, params);
        const [totalRows] = await db.execute(countSql, countParams);

        res.json({ 
            success: true, 
            data: rows,
            total: totalRows[0] ? totalRows[0].total : 0,
            page,
            limit
        });
    } catch (err) { 
        console.error('getStockList Error:', err); 
        res.status(500).json({ success: false, message: 'Failed to fetch stock: ' + err.message }); 
    }
};

const getAvailableVehicles = async (req, res) => {
    let branchId = req.query.branchId;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    try {
        const [rows] = await db.execute(
            `SELECT * FROM tbl_stock WHERE stock_item_branch = ? ORDER BY stock_id DESC`, [branchId || null]);
        res.json({ success: true, data: rows });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to fetch available items' }); }
};

const getStockVerification = async (req, res) => {
    let branchId = req.query.branchId;
    if (!branchId || branchId === 'null' || branchId === 'undefined' || branchId === '') {
        branchId = null;
    }

    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id || null;
    }

    const fromDate = req.query.from || '2000-01-01';
    const toDate = req.query.to || new Date().toISOString().split('T')[0];

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    try {
        const sql = `
            SELECT 
                v.vehicle_name,
                v.vehicle_code,
                b.branch_name,

                /* Opening */
                COALESCE(p_open.pur_open,0)
                - COALESCE(s_open.sales_open,0)
                - COALESCE(t_open.transfer_open,0) AS opening_stock,

                /* Purchase between dates */
                COALESCE(p_cur.pur_cur,0) AS purchase,

                /* Sales between dates */
                COALESCE(s_cur.sales_cur,0) AS sales,

                /* Transfer between dates */
                COALESCE(t_cur.transfer_cur,0) AS branch_transfer,

                /* Final Stock */
                (
                    COALESCE(p_open.pur_open,0)
                    - COALESCE(s_open.sales_open,0)
                    - COALESCE(t_open.transfer_open,0)
                    + COALESCE(p_cur.pur_cur,0)
                    - COALESCE(s_cur.sales_cur,0)
                    - COALESCE(t_cur.transfer_cur,0)
                ) AS stock

            FROM
            (
                /* Vehicle master with insertion order */
                SELECT 
                    pi.materialName AS vehicle_name,
                    pi.materialsId AS vehicle_code,
                    MIN(pi.purchaseItemId) AS first_id
                FROM purchaseitem pi
                GROUP BY pi.materialsId, pi.materialName
            ) v
            CROSS JOIN tbl_branch b

            /* Opening Purchase */
            LEFT JOIN (
                SELECT pi.materialsId, pb.purch_branchId, COUNT(*) AS pur_open
                FROM purchaseitem pi
                JOIN purchaseitembill pb 
                    ON pi.purchaseItemBillId = pb.purchaseItemBillId
                WHERE pb.invoiceDate < ?
                GROUP BY pi.materialsId, pb.purch_branchId
            ) p_open 
                ON v.vehicle_code = p_open.materialsId AND b.b_id = p_open.purch_branchId

            /* Opening Sales */
            LEFT JOIN (
                SELECT inv_vehicle_code, inv_branch, COUNT(*) AS sales_open
                FROM tbl_invoice_labour
                WHERE inv_inv_date < ?
                GROUP BY inv_vehicle_code, inv_branch
            ) s_open 
                ON v.vehicle_code = s_open.inv_vehicle_code AND b.b_id = s_open.inv_branch

            /* Opening Transfer */
            LEFT JOIN (
                SELECT vehicle_code, ic_branch, COUNT(*) AS transfer_open
                FROM tbl_branch_transfer
                WHERE debit_note_date < ?
                GROUP BY vehicle_code, ic_branch
            ) t_open 
                ON v.vehicle_code = t_open.vehicle_code AND b.b_id = t_open.ic_branch

            /* Current Purchase */
            LEFT JOIN (
                SELECT pi.materialsId, pb.purch_branchId, COUNT(*) AS pur_cur
                FROM purchaseitem pi
                JOIN purchaseitembill pb 
                    ON pi.purchaseItemBillId = pb.purchaseItemBillId
                WHERE pb.invoiceDate BETWEEN ? AND ?
                GROUP BY pi.materialsId, pb.purch_branchId
            ) p_cur 
                ON v.vehicle_code = p_cur.materialsId AND b.b_id = p_cur.purch_branchId

            /* Current Sales */
            LEFT JOIN (
                SELECT inv_vehicle_code, inv_branch, COUNT(*) AS sales_cur
                FROM tbl_invoice_labour
                WHERE inv_inv_date BETWEEN ? AND ?
                GROUP BY inv_vehicle_code, inv_branch
            ) s_cur 
                ON v.vehicle_code = s_cur.inv_vehicle_code AND b.b_id = s_cur.inv_branch

            /* Current Transfer */
            LEFT JOIN (
                SELECT vehicle_code, ic_branch, COUNT(*) AS transfer_cur
                FROM tbl_branch_transfer
                WHERE debit_note_date BETWEEN ? AND ?
                GROUP BY vehicle_code, ic_branch
            ) t_cur 
                ON v.vehicle_code = t_cur.vehicle_code AND b.b_id = t_cur.ic_branch

            WHERE (? IS NULL OR b.b_id = ?)
            ORDER BY v.first_id, b.branch_name
            LIMIT ${limit} OFFSET ${offset}
        `;

        const params = [
            fromDate, // p_open
            fromDate, // s_open
            fromDate, // t_open
            fromDate, toDate, // p_cur
            fromDate, toDate, // s_cur
            fromDate, toDate, // t_cur
            branchId, branchId // Global filter
        ];

        const [rows] = await db.execute(sql, params);

        /* Total vehicle count x branch count if no branch selected */
        const countSql = branchId 
            ? `SELECT COUNT(*) as total FROM (SELECT materialsId FROM purchaseitem GROUP BY materialsId) x`
            : `SELECT (SELECT COUNT(*) FROM (SELECT materialsId FROM purchaseitem GROUP BY materialsId) x) * (SELECT COUNT(*) FROM tbl_branch) as total`;

        const [countRows] = await db.execute(countSql);

        res.json({
            success: true,
            data: rows,
            total: countRows[0] ? countRows[0].total : 0,
            page,
            limit
        });

    } catch (err) {
        console.error('getStockVerification error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stock verification: ' + err.message
        });
    }
};

const getStockSplitup = async (req, res) => {
    let branchId = req.query.branchId;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const fromDate = req.query.from, toDate = req.query.to;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    try {
        let conditions = [];
        let params = [];
        if (branchId) { conditions.push('tbl_stock.stock_item_branch = ?'); params.push(branchId); }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const [rows] = await db.execute(
            `SELECT stock_item_name as stock_model, '' as stock_colour,
             stock_qty as available
             FROM tbl_stock ${where} ORDER BY stock_item_name LIMIT ${limit} OFFSET ${offset}`, params);

        const [countRows] = await db.execute(`SELECT COUNT(*) as total FROM tbl_stock ${where}`, params);
        res.json({ success: true, data: rows, total: countRows[0].total, page, limit });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to fetch stock splitup' }); }
};

const fs = require('fs');
const updateStock = async (req, res) => {
    const { productId, branchId, qty } = req.body;
    const logPath = path.join(__dirname, '../debug_stock.log');
    const log = (msg) => {
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
        console.log(msg);
    };

    log(`--- updateStock Request ---`);
    log(`Payload: ${JSON.stringify({ productId, branchId, qty })}`);

    try {
        log(`Fetching product details for ID: ${productId}`);
        const [productRows] = await db.execute('SELECT labour_code, labour_title FROM tbl_labour_code WHERE labour_id = ?', [productId]);
        
        if (!productRows || productRows.length === 0) {
            log(`Product ${productId} not found in tbl_labour_code`);
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const { labour_code, labour_title } = productRows[0];
        log(`Product info retrieved: ${labour_code} - ${labour_title}`);

        log(`Checking for existing record in tbl_stock (item: ${productId}, branch: ${branchId})`);
        const [existing] = await db.execute(
            'SELECT stock_id FROM tbl_stock WHERE stock_item_id = ? AND stock_item_branch = ?',
            [productId, branchId]
        );

        if (existing && existing.length > 0) {
            log(`Existing record found (ID: ${existing[0].stock_id}). Updating...`);
            const sql = 'UPDATE tbl_stock SET stock_qty = ?, opening_stock = ? WHERE stock_id = ?';
            const params = [qty, qty, existing[0].stock_id];
            await db.execute(sql, params);
            log(`Update successful`);
        } else {
            log(`No existing record found. Inserting new row...`);
            const sql = `INSERT INTO tbl_stock (stock_item_id, stock_item_code, stock_item_name, stock_item_branch, stock_qty, opening_stock) VALUES (?, ?, ?, ?, ?, ?)`;
            const params = [productId, labour_code, labour_title, branchId, qty, qty];
            await db.execute(sql, params);
            log(`Insert successful`);
        }

        log(`--- updateStock Success ---`);
        res.json({ success: true, message: 'Stock updated successfully' });
    } catch (err) {
        log(`!!! updateStock ERROR: ${err.message}`);
        log(err.stack);
        res.status(500).json({ success: false, message: 'Failed to update stock: ' + err.message });
    }
};

const deleteStock = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM tbl_stock WHERE stock_id = ?', [id]);
        res.json({ success: true, message: 'Stock entry deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error: ' + err.message });
    }
};

const exportStockVerificationExcel = async (req, res) => {
    let branchId = req.query.branchId;
    if (!branchId || branchId === 'null' || branchId === 'undefined' || branchId === '') branchId = null;
    if (req.user && req.user.role == 2) branchId = req.user.branch_id || null;

    const fromDate = req.query.from || '2000-01-01';
    const toDate = req.query.to || new Date().toISOString().split('T')[0];

    try {
        const sql = `
            SELECT 
                v.vehicle_name, v.vehicle_code, b.branch_name,
                COALESCE(p_open.pur_open,0) - COALESCE(s_open.sales_open,0) - COALESCE(t_open.transfer_open,0) AS opening_stock,
                COALESCE(p_cur.pur_cur,0) AS purchase,
                COALESCE(s_cur.sales_cur,0) AS sales,
                COALESCE(t_cur.transfer_cur,0) AS branch_transfer,
                (COALESCE(p_open.pur_open,0) - COALESCE(s_open.sales_open,0) - COALESCE(t_open.transfer_open,0) + COALESCE(p_cur.pur_cur,0) - COALESCE(s_cur.sales_cur,0) - COALESCE(t_cur.transfer_cur,0)) AS stock
            FROM
            (SELECT pi.materialName AS vehicle_name, pi.materialsId AS vehicle_code, MIN(pi.purchaseItemId) AS first_id FROM purchaseitem pi GROUP BY pi.materialsId, pi.materialName) v
            CROSS JOIN tbl_branch b
            LEFT JOIN (SELECT pi.materialsId, pb.purch_branchId, COUNT(*) AS pur_open FROM purchaseitem pi JOIN purchaseitembill pb ON pi.purchaseItemBillId = pb.purchaseItemBillId WHERE pb.invoiceDate < ? GROUP BY pi.materialsId, pb.purch_branchId) p_open ON v.vehicle_code = p_open.materialsId AND b.b_id = p_open.purch_branchId
            LEFT JOIN (SELECT inv_vehicle_code, inv_branch, COUNT(*) AS sales_open FROM tbl_invoice_labour WHERE inv_inv_date < ? GROUP BY inv_vehicle_code, inv_branch) s_open ON v.vehicle_code = s_open.inv_vehicle_code AND b.b_id = s_open.inv_branch
            LEFT JOIN (SELECT vehicle_code, ic_branch, COUNT(*) AS transfer_open FROM tbl_branch_transfer WHERE debit_note_date < ? GROUP BY vehicle_code, ic_branch) t_open ON v.vehicle_code = t_open.vehicle_code AND b.b_id = t_open.ic_branch
            LEFT JOIN (SELECT pi.materialsId, pb.purch_branchId, COUNT(*) AS pur_cur FROM purchaseitem pi JOIN purchaseitembill pb ON pi.purchaseItemBillId = pb.purchaseItemBillId WHERE pb.invoiceDate BETWEEN ? AND ? GROUP BY pi.materialsId, pb.purch_branchId) p_cur ON v.vehicle_code = p_cur.materialsId AND b.b_id = p_cur.purch_branchId
            LEFT JOIN (SELECT inv_vehicle_code, inv_branch, COUNT(*) AS sales_cur FROM tbl_invoice_labour WHERE inv_inv_date BETWEEN ? AND ? GROUP BY inv_vehicle_code, inv_branch) s_cur ON v.vehicle_code = s_cur.inv_vehicle_code AND b.b_id = s_cur.inv_branch
            LEFT JOIN (SELECT vehicle_code, ic_branch, COUNT(*) AS transfer_cur FROM tbl_branch_transfer WHERE debit_note_date BETWEEN ? AND ? GROUP BY vehicle_code, ic_branch) t_cur ON v.vehicle_code = t_cur.vehicle_code AND b.b_id = t_cur.ic_branch
            WHERE (? IS NULL OR b.b_id = ?)
            ORDER BY v.first_id, b.branch_name
        `;
        const [rows] = await db.execute(sql, [fromDate, fromDate, fromDate, fromDate, toDate, fromDate, toDate, fromDate, toDate, branchId, branchId]);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Stock Verification');
        worksheet.columns = [
            { header: 'SI:NO', key: 'sino', width: 8 },
            { header: 'VEHICLE NAME', key: 'vehicle_name', width: 25 },
            { header: 'VEHICLE CODE', key: 'vehicle_code', width: 15 },
            { header: 'BRANCH', key: 'branch_name', width: 20 },
            { header: 'OPENING STOCK', key: 'opening_stock', width: 15 },
            { header: 'PURCHASE', key: 'purchase', width: 12 },
            { header: 'SALES', key: 'sales', width: 12 },
            { header: 'BRANCH TRANSFER', key: 'branch_transfer', width: 18 },
            { header: 'STOCK', key: 'stock', width: 12 }
        ];
        worksheet.getRow(1).font = { bold: true };
        rows.forEach((r, i) => worksheet.addRow({ sino: i + 1, ...r }));

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=StockVerification_${fromDate}_to_${toDate}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Export failed' });
    }
};

const exportStockVerificationPagedExcel = async (req, res) => {
    let branchId = req.query.branchId;
    if (!branchId || branchId === 'null' || branchId === 'undefined' || branchId === '') branchId = null;
    if (req.user && req.user.role == 2) branchId = req.user.branch_id || null;

    const fromDate = req.query.from || '2000-01-01';
    const toDate = req.query.to || new Date().toISOString().split('T')[0];
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    try {
        const sql = `
            SELECT 
                v.vehicle_name, v.vehicle_code, b.branch_name,
                COALESCE(p_open.pur_open,0) - COALESCE(s_open.sales_open,0) - COALESCE(t_open.transfer_open,0) AS opening_stock,
                COALESCE(p_cur.pur_cur,0) AS purchase,
                COALESCE(s_cur.sales_cur,0) AS sales,
                COALESCE(t_cur.transfer_cur,0) AS branch_transfer,
                (COALESCE(p_open.pur_open,0) - COALESCE(s_open.sales_open,0) - COALESCE(t_open.transfer_open,0) + COALESCE(p_cur.pur_cur,0) - COALESCE(s_cur.sales_cur,0) - COALESCE(t_cur.transfer_cur,0)) AS stock
            FROM
            (SELECT pi.materialName AS vehicle_name, pi.materialsId AS vehicle_code, MIN(pi.purchaseItemId) AS first_id FROM purchaseitem pi GROUP BY pi.materialsId, pi.materialName) v
            CROSS JOIN tbl_branch b
            LEFT JOIN (SELECT pi.materialsId, pb.purch_branchId, COUNT(*) AS pur_open FROM purchaseitem pi JOIN purchaseitembill pb ON pi.purchaseItemBillId = pb.purchaseItemBillId WHERE pb.invoiceDate < ? GROUP BY pi.materialsId, pb.purch_branchId) p_open ON v.vehicle_code = p_open.materialsId AND b.b_id = p_open.purch_branchId
            LEFT JOIN (SELECT inv_vehicle_code, inv_branch, COUNT(*) AS sales_open FROM tbl_invoice_labour WHERE inv_inv_date < ? GROUP BY inv_vehicle_code, inv_branch) s_open ON v.vehicle_code = s_open.inv_vehicle_code AND b.b_id = s_open.inv_branch
            LEFT JOIN (SELECT vehicle_code, ic_branch, COUNT(*) AS transfer_open FROM tbl_branch_transfer WHERE debit_note_date < ? GROUP BY vehicle_code, ic_branch) t_open ON v.vehicle_code = t_open.vehicle_code AND b.b_id = t_open.ic_branch
            LEFT JOIN (SELECT pi.materialsId, pb.purch_branchId, COUNT(*) AS pur_cur FROM purchaseitem pi JOIN purchaseitembill pb ON pi.purchaseItemBillId = pb.purchaseItemBillId WHERE pb.invoiceDate BETWEEN ? AND ? GROUP BY pi.materialsId, pb.purch_branchId) p_cur ON v.vehicle_code = p_cur.materialsId AND b.b_id = p_cur.purch_branchId
            LEFT JOIN (SELECT inv_vehicle_code, inv_branch, COUNT(*) AS sales_cur FROM tbl_invoice_labour WHERE inv_inv_date BETWEEN ? AND ? GROUP BY inv_vehicle_code, inv_branch) s_cur ON v.vehicle_code = s_cur.inv_vehicle_code AND b.b_id = s_cur.inv_branch
            LEFT JOIN (SELECT vehicle_code, ic_branch, COUNT(*) AS transfer_cur FROM tbl_branch_transfer WHERE debit_note_date BETWEEN ? AND ? GROUP BY vehicle_code, ic_branch) t_cur ON v.vehicle_code = t_cur.vehicle_code AND b.b_id = t_cur.ic_branch
            WHERE (? IS NULL OR b.b_id = ?)
            ORDER BY v.first_id, b.branch_name
            LIMIT ${limit} OFFSET ${offset}
        `;
        const [rows] = await db.execute(sql, [fromDate, fromDate, fromDate, fromDate, toDate, fromDate, toDate, fromDate, toDate, branchId, branchId]);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Stock Verification Page');
        worksheet.mergeCells('A1:I1');
        worksheet.getRow(1).getCell(1).value = 'Stock Verification Statement';
        worksheet.getRow(1).getCell(1).alignment = { horizontal: 'center' };
        worksheet.getRow(1).getCell(1).font = { bold: true };

        worksheet.getRow(2).values = ['VEHICLE NAME', 'VEHICLE CODE', 'BRANCH', 'OPENING STOCK', 'PURCHASE', 'SALES', 'BRANCH TRANSFER', 'STOCK'];
        worksheet.getRow(2).font = { bold: true };

        rows.forEach(r => {
            worksheet.addRow([r.vehicle_name, r.vehicle_code, r.branch_name, r.opening_stock, r.purchase, r.sales, r.branch_transfer, r.stock]);
        });

        worksheet.columns.forEach(col => { col.width = 20; });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=StockVerificationPaged_${page}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Export failed' });
    }
};

const exportStockVerificationPagedCsv = async (req, res) => {
    let branchId = req.query.branchId;
    if (!branchId || branchId === 'null' || branchId === 'undefined' || branchId === '') branchId = null;
    if (req.user && req.user.role == 2) branchId = req.user.branch_id || null;

    const fromDate = req.query.from || '2000-01-01';
    const toDate = req.query.to || new Date().toISOString().split('T')[0];
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    try {
        const sql = `
            SELECT 
                v.vehicle_name, v.vehicle_code, b.branch_name,
                COALESCE(p_open.pur_open,0) - COALESCE(s_open.sales_open,0) - COALESCE(t_open.transfer_open,0) AS opening_stock,
                COALESCE(p_cur.pur_cur,0) AS purchase,
                COALESCE(s_cur.sales_cur,0) AS sales,
                COALESCE(t_cur.transfer_cur,0) AS branch_transfer,
                (COALESCE(p_open.pur_open,0) - COALESCE(s_open.sales_open,0) - COALESCE(t_open.transfer_open,0) + COALESCE(p_cur.pur_cur,0) - COALESCE(s_cur.sales_cur,0) - COALESCE(t_cur.transfer_cur,0)) AS stock
            FROM
            (SELECT pi.materialName AS vehicle_name, pi.materialsId AS vehicle_code, MIN(pi.purchaseItemId) AS first_id FROM purchaseitem pi GROUP BY pi.materialsId, pi.materialName) v
            CROSS JOIN tbl_branch b
            LEFT JOIN (SELECT pi.materialsId, pb.purch_branchId, COUNT(*) AS pur_open FROM purchaseitem pi JOIN purchaseitembill pb ON pi.purchaseItemBillId = pb.purchaseItemBillId WHERE pb.invoiceDate < ? GROUP BY pi.materialsId, pb.purch_branchId) p_open ON v.vehicle_code = p_open.materialsId AND b.b_id = p_open.purch_branchId
            LEFT JOIN (SELECT inv_vehicle_code, inv_branch, COUNT(*) AS sales_open FROM tbl_invoice_labour WHERE inv_inv_date < ? GROUP BY inv_vehicle_code, inv_branch) s_open ON v.vehicle_code = s_open.inv_vehicle_code AND b.b_id = s_open.inv_branch
            LEFT JOIN (SELECT vehicle_code, ic_branch, COUNT(*) AS transfer_open FROM tbl_branch_transfer WHERE debit_note_date < ? GROUP BY vehicle_code, ic_branch) t_open ON v.vehicle_code = t_open.vehicle_code AND b.b_id = t_open.ic_branch
            LEFT JOIN (SELECT pi.materialsId, pb.purch_branchId, COUNT(*) AS pur_cur FROM purchaseitem pi JOIN purchaseitembill pb ON pi.purchaseItemBillId = pb.purchaseItemBillId WHERE pb.invoiceDate BETWEEN ? AND ? GROUP BY pi.materialsId, pb.purch_branchId) p_cur ON v.vehicle_code = p_cur.materialsId AND b.b_id = p_cur.purch_branchId
            LEFT JOIN (SELECT inv_vehicle_code, inv_branch, COUNT(*) AS sales_cur FROM tbl_invoice_labour WHERE inv_inv_date BETWEEN ? AND ? GROUP BY inv_vehicle_code, inv_branch) s_cur ON v.vehicle_code = s_cur.inv_vehicle_code AND b.b_id = s_cur.inv_branch
            LEFT JOIN (SELECT vehicle_code, ic_branch, COUNT(*) AS transfer_cur FROM tbl_branch_transfer WHERE debit_note_date BETWEEN ? AND ? GROUP BY vehicle_code, ic_branch) t_cur ON v.vehicle_code = t_cur.vehicle_code AND b.b_id = t_cur.ic_branch
            WHERE (? IS NULL OR b.b_id = ?)
            ORDER BY v.first_id, b.branch_name
            LIMIT ${limit} OFFSET ${offset}
        `;
        const [rows] = await db.execute(sql, [fromDate, fromDate, fromDate, fromDate, toDate, fromDate, toDate, fromDate, toDate, branchId, branchId]);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Stock Verification CSV');
        worksheet.addRow(['VEHICLE NAME', 'VEHICLE CODE', 'BRANCH', 'OPENING STOCK', 'PURCHASE', 'SALES', 'BRANCH TRANSFER', 'STOCK']);
        
        rows.forEach(r => {
            worksheet.addRow([r.vehicle_name, r.vehicle_code, r.branch_name, r.opening_stock, r.purchase, r.sales, r.branch_transfer, r.stock]);
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=StockVerificationPaged_${page}.csv`);
        await workbook.csv.write(res);
        res.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Export failed' });
    }
};

module.exports = { 
    getStockList, 
    getAvailableVehicles, 
    getStockVerification, 
    getStockSplitup, 
    updateStock, 
    deleteStock,
    exportStockVerificationExcel,
    exportStockVerificationPagedExcel,
    exportStockVerificationPagedCsv
};

