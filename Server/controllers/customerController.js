const db = require('../config/db');

const searchCustomers = async (req, res) => {
    const query = req.query.query || '';
    try {
        const [rows] = await db.execute(
            `SELECT * FROM customer_details WHERE cus_name LIKE ? OR cus_phone LIKE ? OR cus_chassis_no LIKE ? LIMIT 20`,
            [`%${query}%`, `%${query}%`, `%${query}%`]
        );
        res.json({ success: true, data: rows });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to search customers' }); }
};

const addCustomer = async (req, res) => {
    const { name, phone, address, chassisNo, engineNo } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Customer name required' });
    try {
        const [result] = await db.execute(
            `INSERT INTO customer_details (cus_name, cus_phone, cus_address, cus_chassis_no, cus_engine_no) VALUES (?, ?, ?, ?, ?)`,
            [name, phone || '', address || '', chassisNo || '', engineNo || '']
        );
        res.json({ success: true, message: 'Customer added', cus_id: result.insertId });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to add customer' }); }
};

const listCustomers = async (req, res) => {
    const page = parseInt(req.query.page) || 1, limit = parseInt(req.query.limit) || 25, offset = (page - 1) * limit;
    const search = req.query.search || '';
    try {
        let where = '', params = [];
        if (search) { where = 'WHERE cus_name LIKE ? OR cus_phone LIKE ?'; params = [`%${search}%`, `%${search}%`]; }
        const [rows] = await db.execute(`SELECT * FROM customer_details ${where} ORDER BY cus_id DESC LIMIT ${limit} OFFSET ${offset}`, params);
        const [countRows] = await db.execute(`SELECT COUNT(*) as total FROM customer_details ${where}`, params);
        res.json({ success: true, data: rows, total: countRows[0].total, page, limit });
    } catch (err) {
        console.error('listCustomers error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch customers', error: err.message, sql: err.sql });
    }
};

const checkChassisUnique = async (req, res) => {
    const chassisNo = req.query.chassisNo;
    if (!chassisNo) return res.status(400).json({ success: false, message: 'Chassis number required' });
    try {
        const [rows] = await db.execute('SELECT cus_id FROM customer_details WHERE cus_chassis_no = ?', [chassisNo]);
        res.json({ success: true, exists: rows.length > 0 });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to check chassis' }); }
};

const checkEngineUnique = async (req, res) => {
    const engineNo = req.query.engineNo;
    if (!engineNo) return res.status(400).json({ success: false, message: 'Engine number required' });
    try {
        const [rows] = await db.execute('SELECT cus_id FROM customer_details WHERE cus_engine_no = ?', [engineNo]);
        res.json({ success: true, exists: rows.length > 0 });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to check engine' }); }
};

module.exports = { searchCustomers, addCustomer, listCustomers, checkChassisUnique, checkEngineUnique };
