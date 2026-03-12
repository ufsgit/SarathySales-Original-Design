const db = require('../config/db');
const path = require('path');

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

        if (branchId) {
            conditions.push('s.stock_item_branch = ?');
            params.push(branchId);
        }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const sql = `
            SELECT 
                s.stock_item_name as vehicle_name,
                s.stock_item_code as vehicle_code,
                b.branch_name,
                s.opening_stock as opening_stock,
                0 as purchase,
                0 as sales,
                0 as branch_transfer,
                s.stock_qty as stock
            FROM tbl_stock s
            LEFT JOIN tbl_branch b ON b.b_id = s.stock_item_branch
            ${where}
            ORDER BY s.stock_item_name
            LIMIT ${limit} OFFSET ${offset}
        `;

        const [rows] = await db.execute(sql, params);

        const [countRows] = await db.execute(
            `SELECT COUNT(*) as total FROM tbl_stock s 
             ${where}`, params
        );

        res.json({ success: true, data: rows, total: countRows[0] ? countRows[0].total : 0, page, limit });
    } catch (err) {
        console.error('getStockVerification error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch stock verification' });
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

module.exports = { getStockList, getAvailableVehicles, getStockVerification, getStockSplitup, updateStock, deleteStock };
