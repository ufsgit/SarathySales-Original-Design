const db = require('../config/db');
const PDFDocument = require('pdfkit');

function numberToWords(num) {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim();
}

function padSerial(n) { return String(n).padStart(5, '0'); }

function nextTransferNoFromLast(lastNo, year, branchId) {
    if (!branchId) return '';
    if (!lastNo) return `BT${year}${branchId}${padSerial(1)}`;
    const normalized = String(lastNo).trim();
    const serialMatch = normalized.match(/(\d{5})$/);
    const lastSerial = serialMatch ? parseInt(serialMatch[1], 10) : 0;
    const lastYear = normalized.substring(2, 6);
    const serial = lastYear === year ? lastSerial + 1 : 1;
    return `BT${year}${branchId}${padSerial(serial)}`;
}

async function getLastTransferNoByBranch(executor, branchId, year) {
    const prefix = `BT${year}${branchId}`;
    const [rows] = await executor.execute(
        `SELECT debit_note_no
         FROM tbl_branch_transfer
         WHERE ic_branch = ?
           AND TRIM(debit_note_no) LIKE CONCAT(?, '%')
         ORDER BY CAST(RIGHT(TRIM(debit_note_no), 5) AS UNSIGNED) DESC
         LIMIT 1`,
        [branchId, prefix]
    );
    return rows?.[0]?.debit_note_no || '';
}

const getNextBranchTransferNo = async (req, res) => {
    let branchId = (req.query.branchId || '').toString().trim();
    if (req.user && req.user.role == 2) {
        branchId = String(req.user.branch_id || '').trim();
    }
    const year = new Date().getFullYear().toString();
    try {
        if (!branchId) return res.status(400).json({ success: false, message: 'branchId is required' });
        const lastNo = await getLastTransferNoByBranch(db, branchId, year);
        res.json({ success: true, transferNo: nextTransferNoFromLast(lastNo, year, branchId) });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to generate transfer number' }); }
};


const getAvailableStock = async (req, res) => {
    let branchId = (req.query.branchId || '').toString().trim();
    if (req.user && req.user.role == 2) {
        branchId = String(req.user.branch_id || '').trim();
    }
    try {
        let sql = `SELECT
                bt.lc_id AS stock_id,
                bt.ic_branch AS stock_branch,
                bt.chassis_no AS stock_chassis_no,
                bt.chassis_no AS chassis_no,
                bt.engine_no AS stock_engine_no,
                bt.engine_no AS engine_no,
                bt.vehicle AS stock_model,
                bt.vehicle AS vehicle,
                bt.vehicle_color AS stock_colour,
                bt.vehicle_color AS color,
                bt.vehicle_code AS stock_type,
                bt.vehicle_code AS p_code,
                bt.debit_note_date AS stock_date,
                bt.trans_total AS total_bill_amount
             FROM tbl_branch_transfer bt
             INNER JOIN (
                SELECT MAX(lc_id) AS lc_id
                FROM tbl_branch_transfer
                WHERE TRIM(COALESCE(chassis_no, '')) <> ''`;
        const params = [];

        if (branchId) {
            sql += ' AND ic_branch = ?';
            params.push(branchId);
        }

        sql += ` GROUP BY TRIM(chassis_no)
             ) latest ON latest.lc_id = bt.lc_id
             ORDER BY bt.lc_id DESC`;

        const [rows] = params.length ? await db.execute(sql, params) : await db.execute(sql);

        res.json({ success: true, data: rows });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to fetch stock' }); }
};

const getInstitutionCustomerName = async (req, res) => {
    const institutionId = parseInt((req.query.institutionId || '').toString(), 10) || 0;
    let branchId = (req.query.branchId || '').toString().trim();
    if (req.user && req.user.role == 2) {
        branchId = String(req.user.branch_id || '').trim();
    }
    if (!institutionId) {
        return res.status(400).json({ success: false, message: 'institutionId required' });
    }

    try {
        let sql = `SELECT lnstitute_name
                   FROM tbl_branch_transfer
                   WHERE lnstitute_branch_id = ?
                     AND TRIM(COALESCE(lnstitute_name, '')) <> ''`;
        const params = [institutionId];

        if (branchId) {
            sql += ' AND ic_branch = ?';
            params.push(branchId);
        }

        sql += ' ORDER BY lc_id DESC LIMIT 1';
        const [rows] = await db.execute(sql, params);

        return res.json({
            success: true,
            name: (rows[0]?.lnstitute_name || '').toString().trim()
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Failed to fetch institution customer name' });
    }
};

const listBranchTransfers = async (req, res) => {
    const branchId = req.query.branchId || null;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const search = (req.query.search || '').trim();
    const offset = (page - 1) * limit;

    try {
        let conditions = [];
        let params = [];

        if (branchId) {
            conditions.push('tbl_branch_transfer.ic_branch = ?');
            params.push(branchId);
        }
        if (search) {
            conditions.push('(debit_note_no LIKE ? OR vehicle LIKE ? OR chassis_no LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

        const mainSql = `SELECT
                tbl_branch_transfer.*,
                tbl_branch.branch_name
             FROM tbl_branch_transfer
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_branch_transfer.ic_branch
             ${where}
             ORDER BY lc_id DESC
             LIMIT ${limit} OFFSET ${offset}`;

        const countSql = `SELECT COUNT(*) as total
             FROM tbl_branch_transfer
             ${where}`;

        const [rows] = params.length ? await db.execute(mainSql, params) : await db.execute(mainSql);
        const [countRows] = params.length ? await db.execute(countSql, params) : await db.execute(countSql);

        res.json({ success: true, data: rows, total: countRows[0].total, page, limit });

    } catch (err) {
        console.error('listBranchTransfers error:', err.message || err);
        res.status(500).json({ success: false, message: 'Failed to fetch transfers' });
    }
};

const getBranchTransfer = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT tbl_branch_transfer.*, b1.branch_name as from_branch_name, b2.branch_name as to_branch_name
             FROM tbl_branch_transfer
             LEFT JOIN tbl_branch b1 ON b1.b_id = tbl_branch_transfer.ic_branch
             LEFT JOIN tbl_branch b2 ON b2.b_id = tbl_branch_transfer.lnstitute_branch_id
             WHERE lc_id = ? ${req.user && req.user.role == 2 ? 'AND tbl_branch_transfer.ic_branch = ?' : ''}`,
            req.user && req.user.role == 2 ? [req.params.id, req.user.branch_id] : [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, transfer: rows[0], items: [] });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to fetch transfer' }); }
};

const saveBranchTransfer = async (req, res) => {
    const {
        transferNo,
        fromBranchId,
        toBranchId,
        transferDate,
        issueType,
        institutionName,
        institutionAddress,
        items
    } = req.body;
    if (!toBranchId) return res.status(400).json({ success: false, message: 'Required fields missing' });
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        let effectiveFromBranchId = (fromBranchId || req.query.branchId || '').toString().trim();

        if (req.user && req.user.role == 2) {
            effectiveFromBranchId = String(req.user.branch_id || '').trim();
        }
        if (!effectiveFromBranchId) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: 'From branch is required' });
        }

        const year = new Date().getFullYear().toString();
        const lastNo = await getLastTransferNoByBranch(conn, effectiveFromBranchId, year);
        const finalTransferNo = nextTransferNoFromLast(lastNo, year, effectiveFromBranchId);

        const firstItem = (items && items[0]) || {};
        const amount = Number(firstItem.amount || 0) || 0;
        let vehicleColorId = (firstItem.colorId || firstItem.colorCode || '').toString().trim();
        const productId = (firstItem.productId || firstItem.pCode || '').toString().trim();

        // If color id is not provided by UI, resolve it from DB by chassis/color.
        if (!vehicleColorId) {
            const chassisNo = (firstItem.chassisNo || '').toString().trim();
            const colorName = (firstItem.colour || '').toString().trim();

            if (chassisNo) {
                const [piRows] = await conn.execute(
                    `SELECT color_id
                     FROM purchaseitem
                     WHERE chassis_no = ? AND TRIM(COALESCE(color_id, '')) <> ''
                     ORDER BY purchaseItemId DESC
                     LIMIT 1`,
                    [chassisNo]
                );
                vehicleColorId = (piRows?.[0]?.color_id || '').toString().trim();
            }

            if (!vehicleColorId && chassisNo) {
                const [btRows] = await conn.execute(
                    `SELECT vehicle_color_id
                     FROM tbl_branch_transfer
                     WHERE chassis_no = ? AND TRIM(COALESCE(vehicle_color_id, '')) <> ''
                     ORDER BY lc_id DESC
                     LIMIT 1`,
                    [chassisNo]
                );
                vehicleColorId = (btRows?.[0]?.vehicle_color_id || '').toString().trim();
            }

            if (!vehicleColorId && colorName) {
                const [modelRows] = await conn.execute(
                    `SELECT mod_code
                     FROM tbl_model
                     WHERE UPPER(TRIM(mod_name)) = UPPER(TRIM(?))
                       AND TRIM(COALESCE(mod_code, '')) <> ''
                     LIMIT 1`,
                    [colorName]
                );
                vehicleColorId = (modelRows?.[0]?.mod_code || '').toString().trim();
            }
        }

        const [result] = await conn.execute(
            `INSERT INTO tbl_branch_transfer (
                debit_note_no, ic_branch, lnstitute_branch_id, debit_note_date, issue_type,
                lnstitute_name, institute_addrss, chassis_no, engine_no, vehicle, vehicle_color,
                vehicle_code, vehicle_color_id, product_id, trans_total, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                finalTransferNo,
                effectiveFromBranchId,
                toBranchId,
                transferDate || new Date(),
                issueType || '',
                institutionName || '',
                institutionAddress || '',
                firstItem.chassisNo || '',
                firstItem.engineNo || '',
                firstItem.model || '',
                firstItem.colour || '',
                firstItem.pCode || '',
                vehicleColorId,
                productId,
                amount,
                'Transferred'
            ]
        );
        const lcId = result.insertId;
        await conn.commit();
        res.json({ success: true, message: 'Branch transfer saved', lc_id: lcId, transferNo: finalTransferNo });
    } catch (err) {
        await conn.rollback();
        console.error('saveBranchTransfer error:', err);
        res.status(500).json({ success: false, message: 'Failed to save transfer', error: err.message });
    }
    finally { conn.release(); }
};

const createBranchTransferPdf = async (req, res) => {
    try {
        const [records] = await db.execute(
            `SELECT bt.*, b.branch_name as from_branch_name, b.branch_address as from_branch_address, b.branch_ph as from_branch_ph, b.branch_gstin as from_branch_gstin
             FROM tbl_branch_transfer bt
             LEFT JOIN tbl_branch b ON b.b_id = bt.ic_branch
             WHERE bt.lc_id = ? ${req.user && req.user.role == 2 ? 'AND bt.ic_branch = ?' : ''}`,
            req.user && req.user.role == 2 ? [req.params.id, req.user.branch_id] : [req.params.id]
        );

        if (!records.length) return res.status(404).json({ success: false, message: 'Transfer record not found' });
        const data = records[0];

        const doc = new PDFDocument({ margin: 30, size: 'A4', bufferPages: true });
        let filename = `BranchTransfer_${data.debit_note_no}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        doc.pipe(res);

        const col = { sl: 40, desc: 90, amt: 470, end: 575 };

        const drawHeaders = (isFirstPage) => {
            if (isFirstPage) {
                // Top Left: Branch Address
                doc.font('Times-Bold').fontSize(7.5).text('Branch Address:', 40, 30);
                doc.font('Times-Bold').fontSize(8.5).text(data.from_branch_name || '', 40, 42);

                const branchAddr = data.from_branch_address ? data.from_branch_address.replace(/\r/g, '') : '';
                const branchAddrH = doc.heightOfString(branchAddr, { width: 220, size: 7 });
                doc.font('Times-Roman').fontSize(7).text(branchAddr, 40, 54, { width: 220, lineGap: -1 });

                let branchY = 54 + branchAddrH + 2;
                doc.text(`PH : ${data.from_branch_ph || ''}`, 40, branchY);

                // Top Center: Sarathy Motors
                doc.font('Times-Bold').fontSize(10).text('SARATHY MOTORS', 240, 30, { width: 200, align: 'center' });
                doc.font('Times-Roman').fontSize(7.5).text('Sarathy Bajaj Pallimukku Kollam Kerala State\nCode: 32 Kerala [State Code :32]', 240, 42, { width: 200, align: 'center' });

                // Top Right: KTM Text
                doc.fontSize(25).font('Times-Bold').text('KTM', 450, 30, { width: 125, align: 'right' });

                // GSTIN Section
                doc.font('Times-Bold').fontSize(7.5).text(`GSTIN:`, 40, 133);
                doc.font('Times-Bold').fontSize(9).text(data.from_branch_gstin || '32ABECS8915L1Z0', 40, 148);

                doc.fontSize(16).text('BRANCH TRANSFER', 240, 140, { width: 200, align: 'center' });
                doc.moveTo(40, 175).lineTo(575, 175).lineWidth(1).stroke();

                // Details Section
                let detailY = 185;
                const fieldX1 = 40, fieldX2 = 120, fieldX3 = 390, fieldX4 = 460;
                doc.font('Times-Bold').fontSize(7.5);

                const drawFieldRow = (label1, val1, label2, val2, y, bold1 = false, bold2 = false) => {
                    doc.font('Times-Bold').text(label1, fieldX1, y);
                    doc.text(':', fieldX2 - 10, y);
                    doc.font(bold1 ? 'Times-Bold' : 'Times-Roman').text(val1 || '', fieldX2, y, { width: 250 });

                    doc.font('Times-Bold').text(label2, fieldX3, y);
                    doc.text(':', fieldX4 - 10, y);
                    doc.font(bold2 ? 'Times-Bold' : 'Times-Roman').text(val2 || '', fieldX4, y, { width: 115 });
                };

                drawFieldRow('Invoice No.', data.debit_note_no, 'Vehicle', data.vehicle || '', detailY, false, true);
                detailY += 12;
                drawFieldRow('Invoice Date', data.debit_note_date ? new Date(data.debit_note_date).toLocaleDateString('en-GB') : '', 'Code.', data.vehicle_code || '', detailY);
                detailY += 12;

                doc.font('Times-Bold').text('Transfer TO', fieldX1, detailY);
                doc.text(':', fieldX2 - 10, detailY);
                let destName = data.lnstitute_name || '';
                doc.font('Times-Bold').text(destName, fieldX2, detailY, { width: 250 });

                doc.font('Times-Bold').text('Color', fieldX3, detailY);
                doc.text(':', fieldX4 - 10, detailY);
                doc.font('Times-Roman').text(data.vehicle_color || '', fieldX4, detailY);
                detailY += 12;

                const destAddr = `${data.institute_addrss || ''}\n\nKerala[State Code :32] INDIA`;
                const destAddrH = doc.heightOfString(destAddr, { width: 250, size: 7.5 });
                doc.font('Times-Roman').text(destAddr, fieldX2, detailY, { width: 250 });

                doc.font('Times-Bold').text('Chassis No.', fieldX3, detailY);
                doc.text(':', fieldX4 - 10, detailY);
                doc.font('Times-Bold').text(data.chassis_no || '', fieldX4, detailY);
                detailY += 12;

                doc.font('Times-Bold').text('Engine No', fieldX3, detailY);
                doc.text(':', fieldX4 - 10, detailY);
                doc.font('Times-Bold').text(data.engine_no || '', fieldX4, detailY);
                detailY += 12;

                let finalDetailY = Math.max(detailY, 185 + destAddrH + 30);
                drawFieldRow('Issue Type', data.issue_type || '', '', '', finalDetailY);

                doc.moveTo(40, finalDetailY + 15).lineTo(575, finalDetailY + 15).lineWidth(1).stroke();
                return finalDetailY + 30;
            }
            return 40;
        };

        const drawTableHeader = (y) => {
            doc.font('Times-Bold').fontSize(7.5);
            doc.rect(col.sl, y, col.end - col.sl, 25).stroke();
            doc.text('Sl.No', col.sl + 2, y + 8);
            doc.text('.', col.sl + 2, y + 16);
            doc.text('Description', col.desc + 2, y + 8);
            doc.text('Amount', col.amt + 2, y + 8);

            doc.moveTo(col.desc, y).lineTo(col.desc, y + 25).stroke();
            doc.moveTo(col.amt, y).lineTo(col.amt, y + 25).stroke();
            return y + 25;
        };

        let currentY = drawHeaders(true);
        currentY = drawTableHeader(currentY);

        // Row
        const descText = `ISSUES TO ${data.lnstitute_name} COST OF ONE NEW ${data.vehicle}MOTORCYCLE .(P.CODE :${data.vehicle_code})`;
        const descH = doc.heightOfString(descText, { width: col.amt - col.desc - 10, size: 7.5 });
        const rowH = Math.max(25, descH + 10);

        doc.rect(col.sl, currentY, col.end - col.sl, rowH).stroke();
        doc.moveTo(col.desc, currentY).lineTo(col.desc, currentY + rowH).stroke();
        doc.moveTo(col.amt, currentY).lineTo(col.amt, currentY + rowH).stroke();

        doc.font('Times-Roman').fontSize(7.5);
        doc.text('1', col.sl + 5, currentY + 8);
        doc.text(descText, col.desc + 5, currentY + 8, { width: col.amt - col.desc - 10, align: 'center' });
        doc.text('', col.amt + 5, currentY + 8); // Amount in row matches image (empty)

        currentY += rowH;

        // Totals
        doc.rect(col.sl, currentY, col.end - col.sl, 15).stroke();
        doc.moveTo(col.amt, currentY).lineTo(col.amt, currentY + 15).stroke();
        doc.font('Times-Bold').text('Total Amount', col.sl + 5, currentY + 4, { width: col.amt - col.sl - 10, align: 'center' });
        doc.text(data.trans_total || '0', col.amt + 5, currentY + 4, { width: col.end - col.amt - 10, align: 'center' });

        currentY += 15;

        // Amount in words
        doc.rect(col.sl, currentY, col.end - col.sl, 25).stroke();
        doc.moveTo(200, currentY).lineTo(200, currentY + 25).stroke();
        doc.font('Times-Bold').fontSize(8.5).text('AMOUNT IN WORDS', col.sl + 5, currentY + 8);
        const totalNum = parseFloat(data.trans_total) || 0;
        doc.text(`RS: ${numberToWords(Math.round(totalNum))}`, 205, currentY + 8, { width: col.end - 210 });

        currentY += 30;
        doc.font('Times-Bold').fontSize(8.5).text('Tax amount payable on reverse charges (in Rs.) : Nil', col.sl, currentY);

        currentY += 60;
        doc.font('Times-Roman').fontSize(7.5).text('Sign of Customer Or His Agent', col.sl, currentY);

        // Service Message (as per image)
        const msgY = currentY - 5;
        doc.font('Times-Bold').fontSize(8.5).text('Get your vehicle serviced at regular intervals.', 40, msgY, { width: 535, align: 'center' });
        const nextDate = data.debit_note_date ? new Date(data.debit_note_date) : new Date();
        nextDate.setMonth(nextDate.getMonth() + 3); // Approx 3 months later
        doc.text(`Next due date for service is ${nextDate.toLocaleDateString('en-GB')}`, 40, msgY + 12, { width: 535, align: 'center' });
        doc.text('Thank You & Happy Riding', 40, msgY + 24, { width: 535, align: 'center' });

        doc.font('Times-Bold').fontSize(7.5).text('SARATHY MOTORS', col.end - 150, currentY - 10, { width: 150, align: 'center' });
        doc.moveTo(col.end - 140, currentY + 2).lineTo(col.end - 10, currentY + 2).lineWidth(0.5).stroke();
        doc.font('Times-Bold').fontSize(8.5).text('Authorised Signatory', col.end - 150, currentY + 5, { width: 150, align: 'center' });

        currentY += 45;
        doc.moveTo(col.sl, currentY).lineTo(col.end, currentY).dash(2, { space: 2 }).stroke().undash();

        // Footer
        const totalPages = doc.bufferedPageRange().count;
        for (let i = 0; i < totalPages; i++) {
            doc.switchToPage(i);
            const now = new Date();
            const printedText = `Printed On: ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}`;
            const pageText = `Page ${i + 1}/${totalPages}`;
            doc.font('Times-Roman').fontSize(7.5).text(printedText, 30, 810, { lineBreak: false });
            doc.text(pageText, col.end - 40, 810, { lineBreak: false });
        }

        doc.end();
    } catch (err) {
        console.error('Branch Transfer PDF Error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate Branch Transfer PDF' });
    }
};

const createBranchTransferPdfByNo = async (req, res) => {
    try {
        const [records] = await db.execute(
            `SELECT lc_id FROM tbl_branch_transfer WHERE debit_note_no = ?`, [req.params.no]
        );
        if (!records.length) return res.status(404).json({ success: false, message: 'Transfer record not found' });
        req.params.id = records[0].lc_id;
        return createBranchTransferPdf(req, res);
    } catch (err) {
        console.error('Branch Transfer PDF Error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate Branch Transfer PDF' });
    }
};

module.exports = {
    getNextBranchTransferNo,
    getAvailableStock,
    getInstitutionCustomerName,
    listBranchTransfers,
    getBranchTransfer,
    saveBranchTransfer,
    createBranchTransferPdf,
    createBranchTransferPdfByNo
};
