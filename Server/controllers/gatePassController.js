const db = require('../config/db');

function padSerial(n) { return String(n).padStart(5, '0'); }
async function getNextNo(branchId, branchName = '') {
    const year = new Date().getFullYear().toString();
    console.log(`[gatePassController] getNextNo called for branchId: ${branchId}, branchName: ${branchName}`);

    const [rows] = await db.execute('SELECT MAX(gate_pass_no) as last_no FROM tbl_gate_pass WHERE gate_branch_id = ?', [branchId]);
    const lastNo = rows[0]?.last_no;

    if (!lastNo) {
        const fallback = `GP${year}${branchId}${padSerial(1)}`;
        console.log(`[gatePassController] No existing gate pass found. Fallback: ${fallback}`);
        return fallback;
    }

    console.log(`[gatePassController] Last gate pass number found: ${lastNo}`);
    const lastSerial = parseInt(lastNo.slice(-5), 10) || 0;
    const lastYear = lastNo.substring(2, 6);
    const nextNo = `GP${year}${branchId}${padSerial(lastYear === year ? lastSerial + 1 : 1)}`;
    console.log(`[gatePassController] Generated next gate pass number: ${nextNo}`);
    return nextNo;
}

const getNextGatePassNo = async (req, res) => {
    let branchId = req.query.branchId;
    let branchName = req.query.branchName || '';

    console.log('[gatePassController] Invoking getNextGatePassNo', {
        query: req.query,
        user: req.user ? { id: req.user.id, role: req.user.role, branch: req.user.branch_id } : 'none'
    });

    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
        branchName = req.user.branch_name || '';
        console.log(`[gatePassController] Role 2 detected. Enforcing branchId: ${branchId}`);
    }

    if (!branchId) {
        console.error('[gatePassController] Error: branchId not provided');
        return res.status(400).json({ success: false, message: 'branchId is required' });
    }

    try {
        const gatePassNo = await getNextNo(branchId, branchName);
        res.json({ success: true, gatePassNo });
    } catch (err) {
        console.error('[gatePassController] getNextGatePassNo error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate gate pass number' });
    }
};

const getGatePassInvoices = async (req, res) => {
    let branchId = req.query.branchId || null;
    console.log('[gatePassController] getGatePassInvoices', { branchId, user: req.user?.id });

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

        res.json({ success: true, count: data.length, data });
    } catch (err) {
        console.error('[gatePassController] getGatePassInvoices error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch invoice numbers' });
    }
};

const getGatePassInvoiceDetails = async (req, res) => {
    const invoiceNo = (req.query.invoiceNo || '').toString().trim();
    let branchId = req.query.branchId || null;

    console.log('[gatePassController] getGatePassInvoiceDetails', { invoiceNo, branchId });

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
            console.log(`[gatePassController] Invoice detail not found for: ${invoiceNo}`);
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
        console.error('[gatePassController] getGatePassInvoiceDetails error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch invoice details' });
    }
};

const listGatePasses = async (req, res) => {
    let branchId = req.query.branchId || null;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const search = (req.query.search || '').trim();
    const offset = (page - 1) * limit;

    console.log('[gatePassController] listGatePasses', { branchId, page, limit, search });

    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }

    try {
        let conditions = [];
        let params = [];

        if (branchId) {
            conditions.push('tbl_gate_pass.gate_branch_id = ?');
            params.push(branchId);
        }
        if (search) {
            conditions.push('(gate_pass_no LIKE ? OR gate_cus_name LIKE ? OR gate_vehicle_model LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

        const mainSql = `SELECT
                tbl_gate_pass.*,
                tbl_branch.branch_name
             FROM tbl_gate_pass
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_gate_pass.gate_branch_id
             ${where}
             ORDER BY gate_pass_id DESC
             LIMIT ${limit} OFFSET ${offset}`;

        const countSql = `SELECT COUNT(*) as total
             FROM tbl_gate_pass
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
        console.error('[gatePassController] listGatePasses error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch gate passes' });
    }
};

const saveGatePass = async (req, res) => {
    console.log('[gatePassController] saveGatePass payload:', req.body);
    const { gatePassNo, branchId, gatePassDate, customerName, address,
        reason, vehicleModel, chassisNo, engineNo, amount, remarks } = req.body;

    if (!gatePassNo) return res.status(400).json({ success: false, message: 'Gate pass number required' });
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId required' });

    try {
        const [dupCheck] = await db.execute('SELECT gate_pass_id FROM tbl_gate_pass WHERE gate_pass_no = ?', [gatePassNo]);
        if (dupCheck.length > 0) {
            console.warn(`[gatePassController] Duplicate gate pass number detected: ${gatePassNo}`);
            return res.status(409).json({ success: false, message: 'Gate pass number already exists' });
        }

        const [result] = await db.execute(
            `INSERT INTO tbl_gate_pass (gate_branch_id, gate_pass_no, gate_pass_date, gate_cus_name,
             gate_cus_address, gate_reason, gate_vehicle_model, gate_chassis_no, gate_engine_no, gate_amount, gate_remarks)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [branchId, gatePassNo, gatePassDate || new Date(), customerName || '',
                address || '', reason || '', vehicleModel || '', chassisNo || '', engineNo || '', amount || 0, remarks || '']
        );
        console.log(`[gatePassController] Gate pass saved successfully. ID: ${result.insertId}`);
        res.json({ success: true, message: 'Gate pass saved', gate_pass_id: result.insertId });
    } catch (err) {
        console.error('[gatePassController] saveGatePass error:', err);
        res.status(500).json({ success: false, message: 'Failed to save gate pass' });
    }
};

const getGatePass = async (req, res) => {
    try {
        console.log(`[gatePassController] Fetching gate pass ID: ${req.params.id}`);
        const [rows] = await db.execute(
            `SELECT tbl_gate_pass.*, tbl_branch.branch_name FROM tbl_gate_pass
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_gate_pass.gate_branch_id
             WHERE gate_pass_id = ?`, [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Gate pass not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('[gatePassController] getGatePass error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch gate pass' });
    }
};

const updateGatePass = async (req, res) => {
    console.log(`[gatePassController] Updating gate pass ID: ${req.params.id}`, req.body);
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
        console.error('[gatePassController] updateGatePass error:', err);
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
