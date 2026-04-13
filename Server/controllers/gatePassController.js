const db = require('../config/db');
const PDFDocument = require('pdfkit');

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
        let conditions = ['tbl_gate_pass.pass_status = 1'];
        let params = [];

        if (branchId) {
            conditions.push('tbl_gate_pass.gate_branch_id = ?');
            params.push(branchId);
        }
        if (search) {
            conditions.push('(gate_pass_no LIKE ? OR pass_cus_name LIKE ? OR pass_vehicle LIKE ?)');
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
    const {
        gatePassNo, branchId, gatePassDate, customerName, address,
        vehicleModel, chassisNo, engineNo, color, productCode,
        gate_invoice_id, issueType, selectionDate, status
    } = req.body;

    if (!gatePassNo) return res.status(400).json({ success: false, message: 'Gate pass number required' });
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId required' });

    try {
        const [dupCheck] = await db.execute('SELECT gate_pass_id FROM tbl_gate_pass WHERE gate_pass_no = ?', [gatePassNo]);
        if (dupCheck.length > 0) {
            console.warn(`[gatePassController] Duplicate gate pass number detected: ${gatePassNo}`);
            return res.status(409).json({ success: false, message: 'Gate pass number already exists' });
        }

        const [result] = await db.execute(
            `INSERT INTO tbl_gate_pass (
                gate_invoice_id, gate_pass_no, gate_pass_date, gate_branch_id, 
                pass_issue_type, pass_cus_name, pass_invoic_no, pass_cus_addrs, 
                selection_date, pass_chassis_no, pass_engine_no, pass_vehicle, 
                pass_vehicle_color, pass_vehicle_code, pass_status
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                gate_invoice_id || 0, gatePassNo, gatePassDate || new Date(), branchId,
                issueType || '', customerName || '', req.body.invoiceNo || '', address || '',
                selectionDate || null, chassisNo || '', engineNo || '', vehicleModel || '',
                color || '', productCode || '', status || 1
            ]
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
    const {
        gate_invoice_id, gatePassDate, issueType, customerName, invoiceNo, address,
        selectionDate, chassisNo, engineNo, vehicleModel, color, productCode, status
    } = req.body;
    try {
        await db.execute(
            `UPDATE tbl_gate_pass SET 
                gate_invoice_id=?, gate_pass_date=?, pass_issue_type=?, pass_cus_name=?, 
                pass_invoic_no=?, pass_cus_addrs=?, selection_date=?, pass_chassis_no=?, 
                pass_engine_no=?, pass_vehicle=?, pass_vehicle_color=?, pass_vehicle_code=?, 
                pass_status=? 
             WHERE gate_pass_id=?`,
            [
                gate_invoice_id, gatePassDate, issueType, customerName, invoiceNo, address,
                selectionDate, chassisNo, engineNo, vehicleModel, color, productCode, status, req.params.id
            ]
        );
        res.json({ success: true, message: 'Gate pass updated' });
    } catch (err) {
        console.error('[gatePassController] updateGatePass error:', err);
        res.status(500).json({ success: false, message: 'Failed to update gate pass' });
    }
};

const cancelGatePass = async (req, res) => {
    try {
        await db.execute('UPDATE tbl_gate_pass SET pass_status = 0 WHERE gate_pass_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Gate pass canceled successfully' });
    } catch (err) {
        console.error('[gatePassController] cancelGatePass error:', err);
        res.status(500).json({ success: false, message: 'Failed to cancel gate pass' });
    }
};

const createGatePassPdf = async (req, res) => {
    try {
        const [records] = await db.execute(
            `SELECT tbl_gate_pass.*, tbl_branch.branch_name, tbl_branch.branch_address, tbl_branch.branch_ph, tbl_branch.branch_gstin 
             FROM tbl_gate_pass
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_gate_pass.gate_branch_id
             WHERE gate_pass_id = ? ${req.user && req.user.role == 2 ? 'AND gate_branch_id = ?' : ''}`,
            req.user && req.user.role == 2 ? [req.params.id, req.user.branch_id] : [req.params.id]
        );

        if (!records.length) return res.status(404).json({ success: false, message: 'Gate pass not found' });
        const data = records[0];

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        let filename = `GatePass_${data.gate_pass_no}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        doc.pipe(res);

        const col = { start: 40, mid: 300, end: 560 };
        const labelWidth = 80;
        let y = 30;

        doc.font('Times-Bold').fontSize(7.5).text('Branch Address:', col.start, y);
        y += 12;
        doc.font('Times-Bold').fontSize(8.5).text(data.branch_name || '', col.start, y);
        y += 10;
        doc.font('Times-Roman').fontSize(7).text(data.branch_address ? data.branch_address.replace(/\r/g, '').replace(/\n/g, ' ') : '', col.start, y, { width: 180 });
        doc.text(`PH : ${data.branch_ph || ''}`, col.start, doc.y + 1);

        doc.font('Times-Bold').fontSize(9).text('SARATHY MOTORS', 200, 30, { align: 'center', width: 200 });
        doc.font('Times-Roman').fontSize(7).text('Sarathy Bajaj Pallimukku Kollam Kerala State', 200, 42, { align: 'center', width: 200 });
        doc.text('Code: 32 Kerala [State Code : 32]', 200, 52, { align: 'center', width: 200 });

        y = 105;
        doc.font('Times-Bold').fontSize(7.5).text(`GSTIN:`, col.start, y);
        doc.font('Times-Bold').fontSize(9).text(data.branch_gstin || '', col.start, y + 11);

        doc.fontSize(14).text('Gate Pass', 200, y, { align: 'center', width: 200 });

        y = 130;
        doc.moveTo(col.start, y).lineTo(col.end, y).stroke();

        y += 10;
        doc.font('Times-Bold').fontSize(8);
        
        const drawRow = (label1, val1, label2, val2, currY) => {
            doc.font('Times-Bold').text(label1, col.start, currY);
            doc.font('Times-Roman').text(`: ${val1 || ''}`, col.start + labelWidth, currY, { width: 180 });
            doc.font('Times-Bold').text(label2, 350, currY);
            doc.font('Times-Roman').text(`: ${val2 || ''}`, 440, currY, { width: 120 });
        };

        drawRow('Pass No.', data.gate_pass_no, 'Billed TO', data.pass_cus_name, y);
        y += 12;
        drawRow('Pass Date', data.gate_pass_date ? new Date(data.gate_pass_date).toLocaleDateString('en-GB') : '', 'Customer Address', data.pass_cus_addrs ? data.pass_cus_addrs.replace(/\r/g, '').replace(/\n/g, ' ') : '', y);
        y += 12;
        drawRow('Issue Type', data.pass_issue_type || '', 'Selection Date', data.selection_date ? new Date(data.selection_date).toLocaleDateString('en-GB') : '', y);
        
        y = Math.max(y + 24, doc.y + 10);
        doc.moveTo(col.start, y).lineTo(col.end, y).stroke();

        y += 10;

        // 5-column table: SL | VEHICLE & COLOR | CHASSIS NO | ENGINE NO | INVOICE / CODE
        const tCol = { sl: 40, veh: 70, chassis: 210, eng: 330, inv: 440, end: 560 };
        const rowH = 25;

        const drawTableHeader = (currY) => {
            doc.rect(col.start, currY, col.end - col.start, rowH).stroke();
            doc.font('Times-Bold').fontSize(7.5);
            doc.text('SL.No.',         tCol.sl + 2,      currY + 9, { width: tCol.veh - tCol.sl - 4 });
            doc.text('VEHICLE & COLOR', tCol.veh + 2,    currY + 9, { width: tCol.chassis - tCol.veh - 4 });
            doc.text('CHASSIS NO',     tCol.chassis + 2, currY + 9, { width: tCol.eng - tCol.chassis - 4 });
            doc.text('ENGINE NO',      tCol.eng + 2,     currY + 9, { width: tCol.inv - tCol.eng - 4 });
            doc.text('INVOICE / CODE', tCol.inv + 2,     currY + 9, { width: tCol.end - tCol.inv - 4 });

            doc.moveTo(tCol.veh,     currY).lineTo(tCol.veh,     currY + rowH).stroke();
            doc.moveTo(tCol.chassis, currY).lineTo(tCol.chassis, currY + rowH).stroke();
            doc.moveTo(tCol.eng,     currY).lineTo(tCol.eng,     currY + rowH).stroke();
            doc.moveTo(tCol.inv,     currY).lineTo(tCol.inv,     currY + rowH).stroke();
        };

        drawTableHeader(y);
        y += rowH;

        const drawDataRow = (currY) => {
            doc.font('Times-Roman').fontSize(8);

            const vehicleDet = [data.pass_vehicle, data.pass_vehicle_color].filter(Boolean).join(' / ');
            const chassisNo  = data.pass_chassis_no || '';
            const engineNo   = data.pass_engine_no  || '';
            const invCode    = [data.pass_invoic_no, data.pass_vehicle_code].filter(Boolean).join('\n');

            const wVeh     = tCol.chassis - tCol.veh - 4;
            const wChassis = tCol.eng - tCol.chassis - 4;
            const wEng     = tCol.inv - tCol.eng - 4;
            const wInv     = tCol.end - tCol.inv - 4;

            const hVeh     = doc.heightOfString(vehicleDet, { width: wVeh });
            const hChassis = doc.heightOfString(chassisNo,  { width: wChassis });
            const hEng     = doc.heightOfString(engineNo,   { width: wEng });
            const hInv     = doc.heightOfString(invCode,    { width: wInv });

            const h = Math.max(20, hVeh, hChassis, hEng, hInv) + 10;

            doc.rect(col.start, currY, col.end - col.start, h).stroke();

            doc.text('1',        tCol.sl + 2,      currY + 5, { width: tCol.veh - tCol.sl - 4 });
            doc.text(vehicleDet, tCol.veh + 2,     currY + 5, { width: wVeh });
            doc.text(chassisNo,  tCol.chassis + 2, currY + 5, { width: wChassis });
            doc.text(engineNo,   tCol.eng + 2,     currY + 5, { width: wEng });
            doc.text(invCode,    tCol.inv + 2,     currY + 5, { width: wInv });

            doc.moveTo(tCol.veh,     currY).lineTo(tCol.veh,     currY + h).stroke();
            doc.moveTo(tCol.chassis, currY).lineTo(tCol.chassis, currY + h).stroke();
            doc.moveTo(tCol.eng,     currY).lineTo(tCol.eng,     currY + h).stroke();
            doc.moveTo(tCol.inv,     currY).lineTo(tCol.inv,     currY + h).stroke();
            return h;
        };

        const dataRowH = drawDataRow(y);
        y += dataRowH;

        // Remarks row - no monetary total for gate pass
        doc.rect(col.start, y, col.end - col.start, 15).stroke();
        doc.font('Times-Bold').fontSize(7.5).text('Authorised Gate Pass — No Monetary Value', col.start + 4, y + 4, { width: col.end - col.start - 8 });
        y += 15;

        y += 60;
        doc.fontSize(8.5).font('Times-Roman');
        doc.text('Sign of Customer Or His Agent', col.start, y);
        doc.text('Thank You & Happy Riding', 200, y, { align: 'center', width: 220 });
        
        doc.font('Times-Bold');
        doc.text('SARATHY MOTORS', col.end - 120, y, { align: 'center', width: 120 });
        doc.font('Times-Roman').fontSize(7.5).text('Authorised Signatory', col.end - 120, y + 10, { align: 'center', width: 120 });

        y += 60;
        doc.moveTo(col.start, y).lineTo(col.end, y).dash(2, { space: 2 }).stroke().undash();

        const now = new Date();
        doc.font('Times-Roman').fontSize(7).text(`Printed On: ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}`, col.start, 800);
        doc.text('Page 1/1', col.end - 45, 800);

        doc.end();
    } catch (err) {
        console.error('Gate Pass PDF Error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate PDF' });
    }
};

module.exports = {
    getNextGatePassNo,
    getGatePassInvoices,
    getGatePassInvoiceDetails,
    listGatePasses,
    saveGatePass,
    getGatePass,
    updateGatePass,
    cancelGatePass,
    createGatePassPdf
};
