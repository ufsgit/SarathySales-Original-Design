const db = require('../config/db');
const PDFDocument = require('pdfkit');

function numberToWords(num) {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return;
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim();
}

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

/** DELETE /api/money-receipt/:id */
const deleteReceipt = async (req, res) => {
    try {
        await db.execute('DELETE FROM tbl_money_receipt WHERE receipt_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Receipt deleted successfully' });
    } catch (err) {
        console.error('deleteReceipt error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete receipt' });
    }
};

/** GET /api/money-receipt/pdf/:id */
const createMoneyReceiptPdf = async (req, res) => {
    try {
        const [records] = await db.execute(
            `SELECT tbl_money_receipt.*, tbl_branch.branch_name, tbl_branch.branch_address, tbl_branch.branch_ph, tbl_branch.branch_gstin, tbl_branch.branch_location 
             FROM tbl_money_receipt
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_money_receipt.rec_branch_id
             WHERE receipt_id = ? ${req.user && req.user.role == 2 ? 'AND rec_branch_id = ?' : ''}`,
            req.user && req.user.role == 2 ? [req.params.id, req.user.branch_id] : [req.params.id]
        );

        if (!records.length) return res.status(404).json({ success: false, message: 'Receipt not found' });
        const data = records[0];

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        let filename = `MoneyReceipt_${data.receipt_no}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        doc.pipe(res);

        // --- Layout Coordinates ---
        const col = { start: 40, mid: 300, end: 560 };
        const labelWidth = 80;
        let y = 30;

        // --- Header ---
        doc.font('Times-Bold').fontSize(7.5).text('Branch Address:', col.start, y);
        y += 12;
        doc.font('Times-Bold').fontSize(8.5).text(data.branch_name || '', col.start, y);
        y += 10;
        doc.font('Times-Roman').fontSize(7).text(data.branch_address ? data.branch_address.replace(/\r/g, '').replace(/\n/g, ' ') : '', col.start, y, { width: 180 });
        doc.text(`PH : ${data.branch_ph || ''}`, col.start, doc.y + 1);

        // Center Header
        doc.font('Times-Bold').fontSize(9).text('SARATHY MOTORS', 200, 30, { align: 'center', width: 200 });
        doc.font('Times-Roman').fontSize(7).text('Sarathy Bajaj Pallimukku Kollam Kerala State', 200, 42, { align: 'center', width: 200 });
        doc.text('Code: 32 Kerala [State Code : 32]', 200, 52, { align: 'center', width: 200 });

        // Right Header
        // const brLoc = (data.branch_location || data.branch_name || '').split(' ')[0].toUpperCase();
        // doc.fontSize(18).font('Times-Bold').text(brLoc, col.end - 100, 30, { align: 'right', width: 100 });

        y = 105;
        doc.font('Times-Bold').fontSize(7.5).text(`GSTIN:`, col.start, y);
        doc.font('Times-Bold').fontSize(9).text(data.branch_gstin || '', col.start, y + 11);

        doc.fontSize(14).text('Money Receipt', 200, y, { align: 'center', width: 200 });

        y = 130;
        doc.moveTo(col.start, y).lineTo(col.end, y).stroke();

        // --- Info Grid ---
        y += 10;
        doc.font('Times-Bold').fontSize(8);
        
        const drawRow = (label1, val1, label2, val2, currY) => {
            doc.font('Times-Bold').text(label1, col.start, currY);
            doc.font('Times-Roman').text(`: ${val1 || ''}`, col.start + labelWidth, currY);
            doc.font('Times-Bold').text(label2, 350, currY);
            doc.font('Times-Roman').text(`: ${val2 || ''}`, 440, currY, { width: 120 });
        };

        drawRow('Receipt No.', data.receipt_no, 'Billed TO', data.receipt_cus, y);
        y += 12;
        drawRow('Receipt Date', data.receipt_date ? new Date(data.receipt_date).toLocaleDateString('en-GB') : '', 'Customer Address', data.receipt_cus_address ? data.receipt_cus_address.replace(/\r/g, '').replace(/\n/g, ' ') : '', y);
        
        y = Math.max(y + 24, doc.y + 10);
        doc.moveTo(col.start, y).lineTo(col.end, y).stroke();

        // --- Table Section ---
        y += 10;
        const tCol = { sl: 40, desc: 70, mode: 350, bank: 450, amt: 510, end: 560 };
        const rowH = 30;

        const drawTableHeader = (currY) => {
            doc.rect(col.start, currY, col.end - col.start, rowH).stroke();
            doc.font('Times-Bold').fontSize(7.5);
            doc.text('SL.No.', tCol.sl + 2, currY + 6, { width: tCol.desc - tCol.sl - 4 });
            doc.text('PARTICULARS / REASON', tCol.desc + 2, currY + 6, { width: tCol.mode - tCol.desc - 4 });
            doc.text('PAYMENT MODE', tCol.mode + 2, currY + 6, { width: tCol.bank - tCol.mode - 4 });
            doc.text('BANK / REFERENCE', tCol.bank + 2, currY + 6, { width: tCol.amt - tCol.bank - 4 });
            doc.text('AMOUNT', tCol.amt + 2, currY + 6, { width: tCol.end - tCol.amt - 2 });

            doc.moveTo(tCol.desc, currY).lineTo(tCol.desc, currY + rowH).stroke();
            doc.moveTo(tCol.mode, currY).lineTo(tCol.mode, currY + rowH).stroke();
            doc.moveTo(tCol.bank, currY).lineTo(tCol.bank, currY + rowH).stroke();
            doc.moveTo(tCol.amt, currY).lineTo(tCol.amt, currY + rowH).stroke();
        };

        drawTableHeader(y);
        y += rowH;

        // Data Row — dynamic height based on content
        const drawDataRow = (currY) => {
            doc.font('Times-Roman').fontSize(8);

            let particulars = data.reason || '';
            if (data.reference) particulars += ` (Ref: ${data.reference})`;

            let payMode = data.pay_type || 'Cash';

            let bankInfo = '';
            if (data.pay_type !== 'Cash') {
                bankInfo = `${data.bank_name || ''} ${data.bank_place || ''}\n${data.cheque_dd_po_no || ''}`;
                if (data.cheque_dd_date) bankInfo += ` / ${new Date(data.cheque_dd_date).toLocaleDateString('en-GB')}`;
            }

            const wDesc = tCol.mode - tCol.desc - 4;
            const wMode = tCol.bank - tCol.mode - 4;
            const wBank = tCol.amt - tCol.bank - 4;
            const wAmt  = tCol.end - tCol.amt - 2;

            const hDesc = doc.heightOfString(particulars, { width: wDesc });
            const hMode = doc.heightOfString(payMode, { width: wMode });
            const hBank = doc.heightOfString(bankInfo, { width: wBank });

            const h = Math.max(20, hDesc, hMode, hBank) + 10;

            doc.rect(col.start, currY, col.end - col.start, h).stroke();

            doc.text('1', tCol.sl + 5, currY + 5, { width: tCol.desc - tCol.sl - 7 });
            doc.text(particulars, tCol.desc + 2, currY + 5, { width: wDesc });
            doc.text(payMode, tCol.mode + 2, currY + 5, { width: wMode });
            doc.text(bankInfo, tCol.bank + 2, currY + 5, { width: wBank });
            doc.text(parseFloat(data.receipt_amount || 0).toFixed(2), tCol.amt, currY + 5, { width: wAmt, align: 'right' });

            doc.moveTo(tCol.desc, currY).lineTo(tCol.desc, currY + h).stroke();
            doc.moveTo(tCol.mode, currY).lineTo(tCol.mode, currY + h).stroke();
            doc.moveTo(tCol.bank, currY).lineTo(tCol.bank, currY + h).stroke();
            doc.moveTo(tCol.amt, currY).lineTo(tCol.amt, currY + h).stroke();
            return h;
        };

        const dataRowH = drawDataRow(y);
        y += dataRowH;

        // Total Row
        doc.rect(col.start, y, col.end - col.start, 15).stroke();
        doc.font('Times-Bold').fontSize(8);
        doc.text('TOTAL', tCol.bank + 2, y + 4);
        doc.text(parseFloat(data.receipt_amount || 0).toFixed(2), tCol.amt, y + 4, { width: tCol.end - tCol.amt - 2, align: 'right' });
        doc.moveTo(tCol.amt, y).lineTo(tCol.amt, y + 15).stroke();
        
        y += 15;

        // --- Amount In Words Section ---
        const drawWordsBox = (currY) => {
            const leftW = 120;
            const rightW = col.end - col.start - leftW;
            const h = 20;

            doc.rect(col.start, currY, leftW, h).stroke();
            doc.rect(col.start + leftW, currY, rightW, h).stroke();

            doc.font('Times-Bold').fontSize(8.5).text('AMOUNT IN WORDS', col.start + 5, currY + 6);
            doc.fontSize(9.5).text(`RS: ${numberToWords(Math.round(data.receipt_amount || 0))} Only`, col.start + leftW + 5, currY + 6, { width: rightW - 10 });
            return h;
        };

        const wordsH = drawWordsBox(y);
        y += wordsH + 5;

        doc.font('Times-Bold').fontSize(8).text('Tax amount payable on reverse charges (in Rs.) : Nil', col.start, y);

        // --- Footer ---
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
        console.error('Money Receipt PDF Error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate PDF' });
    }
};

module.exports = { getNextReceiptNo, listReceipts, saveReceipt, getReceipt, updateReceipt, deleteReceipt, createMoneyReceiptPdf };
