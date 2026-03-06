const express = require('express');
const router = express.Router();
const db = require('../config/db');

/**
 * GET /api/vsi/next-no?branchId=...
 * Generate next VSI invoice number.
 * Format: VS + YEAR + BRANCH_ID + SERIAL(5 digits)
 */
router.get('/next-no', async (req, res) => {
    const branchId = req.query.branchId;
    const year = new Date().getFullYear().toString();
    try {
        const [rows] = await db.execute(
            'SELECT MAX(vsi_id) as max_id FROM tbl_vsi WHERE vsi_branch = ?',
            [branchId]
        );
        const maxId = rows[0].max_id;
        if (!maxId) {
            return res.json({ success: true, vsiNo: `VS${year}${branchId}${String(1).padStart(5, '0')}` });
        }
        const [recRows] = await db.execute('SELECT vsi_no FROM tbl_vsi WHERE vsi_id = ?', [maxId]);
        if (!recRows.length) {
            return res.json({ success: true, vsiNo: `VS${year}${branchId}${String(1).padStart(5, '0')}` });
        }
        const lastNo = recRows[0].vsi_no;
        const lastSerial = parseInt(lastNo.slice(-5), 10) || 0;
        const lastYear = lastNo.substring(2, 6);
        const serial = lastYear === year ? lastSerial + 1 : 1;
        res.json({ success: true, vsiNo: `VS${year}${branchId}${String(serial).padStart(5, '0')}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to generate VSI number' });
    }
});

/**
 * GET /api/vsi/list
 * List VSI invoices for branch.
 */
router.get('/list', async (req, res) => {
    const branchId = req.query.branchId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;
    try {
        let where = 'WHERE tbl_vsi.vsi_branch = ?';
        let params = [branchId];
        if (search) {
            where += ` AND (vsi_no LIKE ? OR vsi_cus_name LIKE ? OR vsi_chassis LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        const [rows] = await db.execute(
            `SELECT tbl_vsi.*, tbl_branch.branch_name
       FROM tbl_vsi
       LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_vsi.vsi_branch
       ${where} ORDER BY vsi_id DESC LIMIT ${limit} OFFSET ${offset}`,
            params
        );
        const [countRows] = await db.execute(`SELECT COUNT(*) as total FROM tbl_vsi ${where}`, params);
        res.json({ success: true, data: rows, total: countRows[0].total, page, limit });
    } catch (err) {
        console.error('vsi list error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch VSI list', error: err.message, sql: err.sql });
    }
});

/**
 * GET /api/vsi/:id
 * Get single VSI invoice with items.
 * Matches PHP: Vsi_model functions
 */
router.get('/:id', async (req, res) => {
    try {
        const [vsiRows] = await db.execute(
            `SELECT tbl_vsi.*, tbl_branch.branch_name
       FROM tbl_vsi
       LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_vsi.vsi_branch
       WHERE vsi_id = ?`,
            [req.params.id]
        );
        if (!vsiRows.length) return res.status(404).json({ success: false, message: 'VSI not found' });
        const [itemRows] = await db.execute('SELECT * FROM tbl_vsi_items WHERE vsi_id = ?', [req.params.id]);
        res.json({ success: true, vsi: vsiRows[0], items: itemRows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch VSI' });
    }
});

/**
 * POST /api/vsi/save
 * Save a VSI invoice with items.
 */
router.post('/save', async (req, res) => {
    const { vsiNo, branchId, vsiDate, customerName, chassisNo, engineNo, modelName, items } = req.body;
    if (!vsiNo || !customerName) {
        return res.status(400).json({ success: false, message: 'Required fields missing' });
    }
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [dupCheck] = await conn.execute('SELECT vsi_id FROM tbl_vsi WHERE vsi_no = ?', [vsiNo]);
        if (dupCheck.length > 0) {
            await conn.rollback();
            return res.status(409).json({ success: false, message: 'VSI number already exists' });
        }
        const [result] = await conn.execute(
            `INSERT INTO tbl_vsi (vsi_no, vsi_branch, vsi_date, vsi_cus_name, vsi_chassis, vsi_engine, vsi_model)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [vsiNo, branchId, vsiDate || new Date(),
                customerName, chassisNo || '', engineNo || '', modelName || '']
        );
        const vsiId = result.insertId;
        for (const item of (items || [])) {
            await conn.execute(
                `INSERT INTO tbl_vsi_items (vsi_id, item_description, item_qty, item_rate, item_amount, item_tax)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [vsiId, item.description || '', item.qty || 1, item.rate || 0, item.amount || 0, item.tax || 0]
            );
        }
        await conn.commit();
        res.json({ success: true, message: 'VSI invoice saved', vsi_id: vsiId });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to save VSI' });
    } finally {
        conn.release();
    }
});

/**
 * PUT /api/vsi/:id
 * Update VSI invoice.
 */
router.put('/:id', async (req, res) => {
    const { vsiDate, customerName, chassisNo, engineNo, modelName, items } = req.body;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        await conn.execute(
            `UPDATE tbl_vsi SET vsi_date = ?, vsi_cus_name = ?, vsi_chassis = ?, vsi_engine = ?, vsi_model = ?
       WHERE vsi_id = ?`,
            [vsiDate, customerName, chassisNo, engineNo, modelName, req.params.id]
        );
        if (items && items.length) {
            await conn.execute('DELETE FROM tbl_vsi_items WHERE vsi_id = ?', [req.params.id]);
            for (const item of items) {
                await conn.execute(
                    'INSERT INTO tbl_vsi_items (vsi_id, item_description, item_qty, item_rate, item_amount, item_tax) VALUES (?, ?, ?, ?, ?, ?)',
                    [req.params.id, item.description, item.qty, item.rate, item.amount, item.tax]
                );
            }
        }
        await conn.commit();
        res.json({ success: true, message: 'VSI updated' });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to update VSI' });
    } finally {
        conn.release();
    }
});

module.exports = router;
