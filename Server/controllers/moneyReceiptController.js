const db = require('../config/db');

function padSerial(n) { return String(n).padStart(5, '0'); }

function buildNo(prefix, year, branchId, serial) {
    return `${prefix}${year}${branchId}${padSerial(serial)}`;
}

async function getNextNo(table, noColumn, branchColumn, branchId, prefix) {
    const year = new Date().getFullYear().toString();
    const [rows] = await db.execute(`SELECT MAX(${noColumn}) as last_no FROM ${table} WHERE ${branchColumn} = ?`, [branchId]);
    const lastNo = rows[0].last_no;
    if (!lastNo) return buildNo(prefix, year, branchId, 1);
    const lastSerial = parseInt(lastNo.slice(-5), 10) || 0;
    const lastYear = lastNo.substring(prefix.length, prefix.length + 4);
    return buildNo(prefix, year, branchId, lastYear === year ? lastSerial + 1 : 1);
}

/** GET /api/money-receipt/next-no */
const getNextReceiptNo = async (req, res) => {
    let branchId = req.query.branchId;

    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    try {
        const no = await getNextNo('tbl_money_receipt', 'receipt_no', 'rec_branch_id', branchId, 'RI');
        res.json({ success: true, receiptNo: no });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to generate receipt number' });
    }
};

/** GET /api/money-receipt/list */
const listReceipts = async (req, res) => {
    let branchId = req.query.branchId;

    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const search = (req.query.search || '').trim();
    const offset = (page - 1) * limit;

    try {
        let conditions = [];
        let params = [];

        if (branchId) {
            conditions.push('tbl_money_receipt.rec_branch_id = ?');
            params.push(branchId);
        }
        if (search) {
            conditions.push('(receipt_no LIKE ? OR receipt_cus LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

        // LIMIT/OFFSET must be inlined in some MySQL driver versions when using execute()
        const [rows] = await db.execute(
            `SELECT tbl_money_receipt.*, tbl_branch.branch_name FROM tbl_money_receipt
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_money_receipt.rec_branch_id
             ${where} ORDER BY tbl_money_receipt.receipt_id DESC LIMIT ${limit} OFFSET ${offset}`,
            params
        );
        const [countRows] = await db.execute(`SELECT COUNT(*) as total FROM tbl_money_receipt ${where}`, params);
        res.json({ success: true, data: rows, total: countRows[0].total, page, limit });
    } catch (err) {
        console.error('listReceipts error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch receipts',
            error: err.message,
            sql: err.sql
        });
    }
};

/** POST /api/money-receipt/save */
const saveReceipt = async (req, res) => {
    let { receiptNo, branchId, receiptDate, reference, reason, payType,
        chequeDate, chequeNo, customerName, address, amount, bank, place, refundStatus } = req.body;

    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    if (!receiptNo || !customerName) {
        return res.status(400).json({ success: false, message: 'Receipt No and Customer Name are required' });
    }
    try {
        const [dupCheck] = await db.execute('SELECT receipt_id FROM tbl_money_receipt WHERE receipt_no = ?', [receiptNo]);
        if (dupCheck.length > 0) return res.status(409).json({ success: false, message: 'Receipt number already exists' });

        const [result] = await db.execute(
            `INSERT INTO tbl_money_receipt
             (rec_branch_id, receipt_no, receipt_date, reference, reason, pay_type,
              cheque_dd_date, cheque_dd_po_no, receipt_cus, receipt_cus_address,
              receipt_amount, bank_name, bank_place, refund_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [branchId, receiptNo, receiptDate || new Date(), reference || '',
                reason || '', payType || '', chequeDate || null, chequeNo || '',
                customerName, address || '', amount || 0, bank || '', place || '', refundStatus || 'No']
        );
        res.json({ success: true, message: 'Money receipt saved', receipt_id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to save receipt' });
    }
};

/** GET /api/money-receipt/:id */
const getReceipt = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT tbl_money_receipt.*, tbl_branch.branch_name FROM tbl_money_receipt
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_money_receipt.rec_branch_id
             WHERE receipt_id = ? ${req.user && req.user.role == 2 ? 'AND rec_branch_id = ?' : ''}`,
            req.user && req.user.role == 2 ? [req.params.id, req.user.branch_id] : [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Receipt not found or access denied' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch receipt' });
    }
};

/** PUT /api/money-receipt/:id */
const updateReceipt = async (req, res) => {
    const { receiptDate, reference, reason, payType, chequeDate, chequeNo,
        customerName, address, amount, bank, place, refundStatus } = req.body;
    try {
        await db.execute(
            `UPDATE tbl_money_receipt SET receipt_date=?, reference=?, reason=?, pay_type=?,
             cheque_dd_date=?, cheque_dd_po_no=?, receipt_cus=?, receipt_cus_address=?,
             receipt_amount=?, bank_name=?, bank_place=?, refund_status=? WHERE receipt_id=?`,
            [receiptDate, reference, reason, payType, chequeDate || null, chequeNo,
                customerName, address, amount, bank, place, refundStatus, req.params.id]
        );
        res.json({ success: true, message: 'Receipt updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to update receipt' });
    }
};

module.exports = { getNextReceiptNo, listReceipts, saveReceipt, getReceipt, updateReceipt };
