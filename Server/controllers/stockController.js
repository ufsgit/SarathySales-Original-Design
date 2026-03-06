const db = require('../config/db');

const getStockList = async (req, res) => {
    const branchId = req.query.branchId || req.query.branchId;
    try {
        const [rows] = await db.execute(
            `SELECT tbl_stock.*, tbl_branch.branch_name FROM tbl_stock
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_stock.stock_branch
             WHERE tbl_stock.stock_branch = ? ORDER BY tbl_stock.stock_id DESC`, [branchId]);
        res.json({ success: true, data: rows });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to fetch stock' }); }
};

const getAvailableVehicles = async (req, res) => {
    const branchId = req.query.branchId || req.query.branchId;
    try {
        const [rows] = await db.execute(
            `SELECT * FROM tbl_stock WHERE stock_branch = ? AND sold_status = 'N' ORDER BY stock_id DESC`, [branchId]);
        res.json({ success: true, data: rows });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to fetch available vehicles' }); }
};

const getStockVerification = async (req, res) => {
    const branchId = req.query.branchId;
    const fromDate = req.query.from, toDate = req.query.to;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    try {
        let conditions = [];
        let params = [];

        // Use placeholders for date conditions in calculations
        const dFrom = fromDate || '1970-01-01';
        const dTo = toDate || '2099-12-31';

        if (branchId) {
            conditions.push('s.stock_branch = ?');
            params.push(branchId);
        }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        // Query to get aggregated stock data per model/type
        // Opening Stock: purchased before fromDate AND not sold before fromDate
        // Purchase: purchased in period
        // Sales: sold in period
        // Branch Transfer: transferred in period
        // Stock: current status

        const sql = `
            SELECT 
                s.stock_model as vehicle_name,
                s.stock_type as vehicle_code,
                b.branch_name,
                SUM(CASE WHEN s.stock_date < ? AND (sl.sale_date IS NULL OR sl.sale_date >= ?) THEN 1 ELSE 0 END) as opening_stock,
                SUM(CASE WHEN s.stock_date BETWEEN ? AND ? THEN 1 ELSE 0 END) as purchase,
                SUM(CASE WHEN sl.sale_date BETWEEN ? AND ? THEN 1 ELSE 0 END) as sales,
                SUM(CASE WHEN tr.trans_date BETWEEN ? AND ? THEN 1 ELSE 0 END) as branch_transfer,
                SUM(CASE WHEN (s.stock_date <= ? AND (sl.sale_date IS NULL OR sl.sale_date > ?)) THEN 1 ELSE 0 END) as stock
            FROM tbl_stock s
            LEFT JOIN tbl_branch b ON b.b_id = s.stock_branch
            LEFT JOIN (
                SELECT inv_chassis, MIN(inv_date) as sale_date 
                FROM tbl_invoice_labour 
                WHERE inv_type IN ('sale', 'Sale', 'Credit') 
                GROUP BY inv_chassis
            ) sl ON sl.inv_chassis = s.stock_chassis_no
            LEFT JOIN (
                SELECT chassis_no, MAX(debit_note_date) as trans_date
                FROM tbl_branch_transfer
                GROUP BY chassis_no
            ) tr ON tr.chassis_no = s.stock_chassis_no
            ${where}
            GROUP BY s.stock_model, s.stock_type, b.branch_name
            ORDER BY s.stock_model
            LIMIT ${limit} OFFSET ${offset}
        `;

        // Execution params: [dFrom, dFrom, dFrom, dTo, dFrom, dTo, dFrom, dTo, dTo, dTo, ...whereParams]
        const execParams = [dFrom, dFrom, dFrom, dTo, dFrom, dTo, dFrom, dTo, dTo, dTo, ...params];

        const [rows] = await db.execute(sql, execParams);

        const [countRows] = await db.execute(
            `SELECT COUNT(*) as total FROM (
                SELECT s.stock_model, s.stock_type, b.branch_name
                FROM tbl_stock s 
                LEFT JOIN tbl_branch b ON b.b_id = s.stock_branch
                ${where} 
                GROUP BY s.stock_model, s.stock_type, b.branch_name
            ) as t`, params
        );

        res.json({ success: true, data: rows, total: countRows[0] ? countRows[0].total : 0, page, limit });
    } catch (err) {
        console.error('getStockVerification error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch stock verification' });
    }
};

const getStockSplitup = async (req, res) => {
    const branchId = req.query.branchId;
    const fromDate = req.query.from, toDate = req.query.to;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    try {
        let conditions = [];
        let params = [];
        if (branchId) { conditions.push('tbl_stock.stock_branch = ?'); params.push(branchId); }
        if (fromDate && toDate) { conditions.push('tbl_stock.stock_date BETWEEN ? AND ?'); params.push(fromDate, toDate); }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const [rows] = await db.execute(
            `SELECT stock_model, stock_colour,
             SUM(CASE WHEN sold_status='N' THEN 1 ELSE 0 END) as available
             FROM tbl_stock ${where} GROUP BY stock_model, stock_colour ORDER BY stock_model LIMIT ${limit} OFFSET ${offset}`, params);

        const [countRows] = await db.execute(`SELECT COUNT(*) FROM (SELECT stock_model, stock_colour FROM tbl_stock ${where} GROUP BY stock_model, stock_colour) as t`, params);
        res.json({ success: true, data: rows, total: countRows[0]['COUNT(*)'], page, limit });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to fetch stock splitup' }); }
};

module.exports = { getStockList, getAvailableVehicles, getStockVerification, getStockSplitup };
