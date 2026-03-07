const db = require('../config/db');

function padSerial(n) { return String(n).padStart(5, '0'); }
async function getNextNo(branchId) {
    const year = new Date().getFullYear().toString();
    const [rows] = await db.execute('SELECT MAX(gate_pass_no) as last_no FROM tbl_gate_pass WHERE gate_branch_id = ?', [branchId]);
    const lastNo = rows[0].last_no;
    if (!lastNo) return `GP${year}${branchId}${padSerial(1)}`;
    const lastSerial = parseInt(lastNo.slice(-5), 10) || 0;
    const lastYear = lastNo.substring(2, 6);
    return `GP${year}${branchId}${padSerial(lastYear === year ? lastSerial + 1 : 1)}`;
}

const getNextGatePassNo = async (req, res) => {
    let branchId = req.query.branchId;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    try {
        res.json({ success: true, gatePassNo: await getNextNo(branchId) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to generate gate pass number' });
    }
};

const getGatePassInvoices = async (req, res) => {
    let branchId = req.query.branchId || null;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    try {
        let sql = `SELECT inv_id, inv_no
                   FROM tbl_invoice_labour
                   WHERE inv_no IS NOT NULL
                     AND TRIM(inv_no) <> ''
                     AND (inv_type = 'sale' OR inv_type = 'Sale' OR inv_type = '01')`;
        const params = [];

        if (branchId) {
            sql += ' AND inv_branch = ?';
            params.push(branchId);
        }

        sql += ' ORDER BY inv_id DESC';
        const [rows] = params.length ? await db.execute(sql, params) : await db.execute(sql);

        const seen = new Set();
        const data = [];
        for (const r of rows) {
            const no = (r.inv_no || '').toString().trim();
            if (!no || seen.has(no)) continue;
            seen.add(no);
            data.push({ inv_id: r.inv_id, inv_no: no });
        }

        res.json({ success: true, data });
    } catch (err) {
        console.error('getGatePassInvoices error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch invoice numbers' });
    }
};

const getGatePassInvoiceDetails = async (req, res) => {
    const invoiceNo = (req.query.invoiceNo || '').toString().trim();
    let branchId = req.query.branchId || null;

    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }

    if (!invoiceNo) {
        return res.status(400).json({ success: false, message: 'invoiceNo required' });
    }

    try {
        let detailSql = `SELECT inv_id, inv_no, inv_cus, inv_cus_addres, inv_chassis, in_engine,
                                inv_vehicle, inv_color, inv_vehicle_code, inv_inv_date, inv_branch
                         FROM tbl_invoice_labour
                         WHERE inv_no = ?`;
        const params = [invoiceNo];

        if (branchId) {
            detailSql += ' AND inv_branch = ?';
            params.push(branchId);
        }

        detailSql += ' ORDER BY inv_id DESC LIMIT 1';
        const [rows] = await db.execute(detailSql, params);
        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        const inv = rows[0];
        let productCode = (inv.inv_vehicle_code || '').toString().trim();

        if (!productCode) {
            const [stockRows] = await db.execute(
                `SELECT stock_item_code
                 FROM tbl_stock
                 WHERE stock_item_branch = ?
                   AND stock_item_name = ?
                 ORDER BY stock_id DESC
                 LIMIT 1`,
                [inv.inv_branch, inv.inv_vehicle || '']
            );
            if (stockRows.length) {
                productCode = (stockRows[0].stock_item_code || '').toString().trim();
            }
        }

        res.json({
            success: true,
            data: {
                inv_id: inv.inv_id,
                customerName: inv.inv_cus || '',
                address: inv.inv_cus_addres || '',
                chassisNo: inv.inv_chassis || '',
                engineNo: inv.in_engine || '',
                vehicleModel: inv.inv_vehicle || '',
                color: inv.inv_color || '',
                productCode,
                selectionDate: inv.inv_inv_date || null
            }
        });
    } catch (err) {
        console.error('getGatePassInvoiceDetails error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch invoice details' });
    }
};

const listGatePasses = async (req, res) => {
    const branchId = req.query.branchId || null;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const search = (req.query.search || '').trim();
    const offset = (page - 1) * limit;

    try {
        let conditions = [];
        let params = [];

        if (branchId) {
            conditions.push('tbl_gate_pass.gate_branch_id = ?');
            params.push(branchId);
        }
        if (search) {
            conditions.push('(gate_pass_no LIKE ? OR pass_cus_name LIKE ? OR pass_invoic_no LIKE ? OR pass_vehicle LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

        // LIMIT/OFFSET inlined — MySQL2 execute() can't bind them reliably via ?
        // Also: pool.execute(sql, []) throws 'undefined' error in some mysql2 versions
        const mainSql = `SELECT
                tbl_gate_pass.gate_pass_id,
                tbl_gate_pass.gate_pass_no,
                tbl_gate_pass.gate_pass_date,
                tbl_gate_pass.pass_cus_name,
                tbl_gate_pass.pass_cus_addrs,
                tbl_gate_pass.pass_invoic_no,
                tbl_gate_pass.pass_vehicle,
                tbl_gate_pass.pass_chassis_no,
                tbl_gate_pass.pass_engine_no,
                tbl_gate_pass.pass_vehicle_color,
                tbl_gate_pass.selection_date,
                tbl_gate_pass.pass_status,
                tbl_branch.branch_name
             FROM tbl_gate_pass
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_gate_pass.gate_branch_id
             ${where}
             ORDER BY gate_pass_id DESC
             LIMIT ${limit} OFFSET ${offset}`;

        const countSql = `SELECT COUNT(*) as total
             FROM tbl_gate_pass
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_gate_pass.gate_branch_id
             ${where}`;

        const [rows] = params.length ? await db.execute(mainSql, params) : await db.execute(mainSql);
        const [countRows] = params.length ? await db.execute(countSql, params) : await db.execute(countSql);

        res.json({
            success: true,
            data: rows,
            total: countRows[0].total,
            page,
            limit
        });

    } catch (err) {
        console.error('listGatePasses error:', err.message || err);
        res.status(500).json({ success: false, message: 'Failed to fetch gate passes' });
    }
};

const saveGatePass = async (req, res) => {
    const { gatePassNo, branchId, gatePassDate, customerName, address,
        reason, vehicleModel, chassisNo, engineNo, amount, remarks } = req.body;
    if (!gatePassNo) return res.status(400).json({ success: false, message: 'Gate pass number required' });
    try {
        const [dupCheck] = await db.execute('SELECT gate_pass_id FROM tbl_gate_pass WHERE gate_pass_no = ?', [gatePassNo]);
        if (dupCheck.length > 0) return res.status(409).json({ success: false, message: 'Gate pass number already exists' });
        const [result] = await db.execute(
            `INSERT INTO tbl_gate_pass (gate_branch_id, gate_pass_no, gate_pass_date, gate_cus_name,
             gate_cus_address, gate_reason, gate_vehicle_model, gate_chassis_no, gate_engine_no, gate_amount, gate_remarks)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [branchId, gatePassNo, gatePassDate || new Date(), customerName || '',
                address || '', reason || '', vehicleModel || '', chassisNo || '', engineNo || '', amount || 0, remarks || '']
        );
        res.json({ success: true, message: 'Gate pass saved', gate_pass_id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to save gate pass' });
    }
};

const getGatePass = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT tbl_gate_pass.*, tbl_branch.branch_name FROM tbl_gate_pass
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_gate_pass.gate_branch_id
             WHERE gate_pass_id = ?`, [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Gate pass not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch gate pass' });
    }
};

const updateGatePass = async (req, res) => {
    const { gatePassDate, customerName, address, reason, vehicleModel, chassisNo, engineNo, amount, remarks } = req.body;
    try {
        await db.execute(
            `UPDATE tbl_gate_pass SET gate_pass_date=?, gate_cus_name=?, gate_cus_address=?,
             gate_reason=?, gate_vehicle_model=?, gate_chassis_no=?, gate_engine_no=?,
             gate_amount=?, gate_remarks=? WHERE gate_pass_id=?`,
            [gatePassDate, customerName, address, reason, vehicleModel, chassisNo, engineNo, amount, remarks, req.params.id]
        );
        res.json({ success: true, message: 'Gate pass updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to update gate pass' });
    }
};

module.exports = {
    getNextGatePassNo,
    getGatePassInvoices,
    getGatePassInvoiceDetails,
    listGatePasses,
    saveGatePass,
    getGatePass,
    updateGatePass
};
