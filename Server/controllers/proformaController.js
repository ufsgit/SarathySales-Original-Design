const db = require('../config/db');
const PDFDocument = require('pdfkit');

function padSerial(n) { return String(n).padStart(5, '0'); }
function nextNoFromLast(lastNo, year, branchId) {
    if (!branchId) return '';
    if (!lastNo) return `PI${year}${branchId}${padSerial(1)}`;

    const normalized = String(lastNo).trim();
    const serialMatch = normalized.match(/(\d{5})$/);
    const lastSerial = serialMatch ? parseInt(serialMatch[1], 10) : 0;
    const lastYear = normalized.substring(2, 6);
    const serial = lastYear === year ? lastSerial + 1 : 1;
    return `PI${year}${branchId}${padSerial(serial)}`;
}

async function getLastProformaNoByBranch(executor, branchId, year) {
    const prefix = `PI${year}${branchId}`;
    const [rows] = await executor.execute(
        `SELECT pro_quot_no
         FROM tbl_proforma
         WHERE pro_branch = ?
           AND TRIM(pro_quot_no) LIKE CONCAT(?, '%')
         ORDER BY CAST(RIGHT(TRIM(pro_quot_no), 5) AS UNSIGNED) DESC
         LIMIT 1`,
        [branchId, prefix]
    );
    return rows?.[0]?.pro_quot_no || '';
}


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
const getNextProformaNo = async (req, res) => {
    let branchId = (req.query.branchId || '').toString().trim();
    if (req.user && req.user.role == 2) {
        branchId = String(req.user.branch_id || '').trim();
    }
    const branchName = (req.query.branchName || '').toString().trim();
    const year = new Date().getFullYear().toString();
    try {
        if (!branchId && branchName) {
            const [branchRows] = await db.execute(
                `SELECT b_id FROM tbl_branch WHERE TRIM(branch_name) = TRIM(?) LIMIT 1`,
                [branchName]
            );
            if (branchRows.length) {
                branchId = String(branchRows[0].b_id || '').trim();
            }
        }
        if (!branchId) {
            return res.status(400).json({ success: false, message: 'branchId is required' });
        }
        const lastNo = await getLastProformaNoByBranch(db, branchId, year);
        res.json({ success: true, proformaNo: nextNoFromLast(lastNo, year, branchId) });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to generate proforma number' }); }
};


const listProformas = async (req, res) => {
    let branchId = req.query.branchId || null;

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
            conditions.push('tbl_proforma.pro_branch = ?');
            params.push(branchId);
        }
        if (search) {
            conditions.push('(pro_quot_no LIKE ? OR pro_cus_name LIKE ? OR pro_contact LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

        const mainSql = `SELECT
                tbl_proforma.pro_id,
                tbl_proforma.pro_quot_no,
                tbl_proforma.pro_date,
                tbl_proforma.pro_cus_name,
                tbl_proforma.pro_cus_address,
                tbl_proforma.pro_contact,
                tbl_proforma.pro_ref,
                tbl_proforma.pro_type_loan,
                tbl_proforma.pro_grand_total,
                tbl_proforma.pro_status,
                tbl_proforma.pro_executive,
                tbl_branch.branch_name
             FROM tbl_proforma
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_proforma.pro_branch
             ${where}
             ORDER BY pro_id DESC
             LIMIT ${limit} OFFSET ${offset}`;

        const countSql = `SELECT COUNT(*) as total
             FROM tbl_proforma
             ${where}`;

        const [rows] = params.length ? await db.execute(mainSql, params) : await db.execute(mainSql);
        const [countRows] = params.length ? await db.execute(countSql, params) : await db.execute(countSql);

        res.json({ success: true, data: rows, total: countRows[0].total, page, limit });

    } catch (err) {
        console.error('listProformas error:', err.message || err);
        res.status(500).json({ success: false, message: 'Failed to fetch proformas' });
    }
};

const getProforma = async (req, res) => {
    try {
        const [proRows] = await db.execute(
            `SELECT tbl_proforma.*, tbl_branch.* FROM tbl_proforma
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_proforma.pro_branch WHERE pro_id = ?`, [req.params.id]);
        if (!proRows.length) return res.status(404).json({ success: false, message: 'Not found' });
        const [itemRows] = await db.execute('SELECT * FROM tbl_proforma_item WHERE proforma_id = ?', [req.params.id]);
        res.json({ success: true, proforma: proRows[0], items: itemRows });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to fetch proforma' }); }
};

const saveProforma = async (req, res) => {
    const { proformaNo, branchId, proformaDate, customerName, address, phone, reference, paymentMode, executive, missell1, missell1Amount, missell2, missell2Amount, lessAmount, totalAmount, totals, items, proStatus } = req.body;
    if (!customerName) return res.status(400).json({ success: false, message: 'Required fields missing' });
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        let effectiveBranchId = branchId || req.query.branchId;

        if (req.user && req.user.role == 2) {
            effectiveBranchId = req.user.branch_id;
        }
        if (!effectiveBranchId) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: 'Branch id required' });
        }

        // Always derive the next quotation number from existing DB data.
        const year = new Date().getFullYear().toString();
        const lastNo = await getLastProformaNoByBranch(conn, effectiveBranchId, year);
        const finalProformaNo = nextNoFromLast(lastNo, year, effectiveBranchId);

        const [result] = await conn.execute(
            `INSERT INTO tbl_proforma (pro_quot_no, pro_branch, pro_date, pro_cus_name, pro_cus_address, pro_contact, pro_ref, pro_type_loan, pro_executive, pro_vehi_tax_total, pro_vehi_sgst_total, pro_vehi_cgst_total, pro_vehi_cess_total, pro_vehicle_total, pro_missal1, pro_missal1_amt, pro_missal2, pro_missal2_amt, pro_less, pro_grand_total, pro_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                finalProformaNo, effectiveBranchId, proformaDate || new Date(), customerName, address || '', phone || '', reference || '', paymentMode || 'Cash', executive || '',
                totals?.taxable || 0, totals?.sgst || 0, totals?.cgst || 0, totals?.cess || 0, totals?.amount || 0,
                missell1 || '', missell1Amount || 0, missell2 || '', missell2Amount || 0, lessAmount || 0, totalAmount || totals?.grandTotal || 0,
                Number.isFinite(parseInt(proStatus, 10)) ? parseInt(proStatus, 10) : 1
            ]
        );
        const proId = result.insertId;
        for (const item of (items || [])) {
            await conn.execute(
                `INSERT INTO tbl_proforma_item (proforma_id, pro_product_id, pro_product_code, pro_product_descr,
                 pro_prduct_bas_amt, pro_product_qty, product_taxable_amt, pro_product_sgst, pro_product_cgst, pro_total, product_cess_amt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [proId, item.productId || '', item.productCode || '', item.productDesc || '',
                    item.baseAmount || 0, item.qty || 1, item.taxableAmount || 0, item.sgst || 0, item.cgst || 0, item.total || 0, item.cess || 0]
            );
        }
        await conn.commit();
        res.json({ success: true, message: 'Proforma saved', pro_id: proId, proformaNo: finalProformaNo });
    } catch (err) { await conn.rollback(); console.error(err); res.status(500).json({ success: false, message: 'Failed to save proforma' }); }
    finally { conn.release(); }
};

const updateProforma = async (req, res) => {
    const { proformaDate, customerName, address, phone, reference, paymentMode, executive, missell1, missell1Amount, missell2, missell2Amount, lessAmount, totalAmount, totals, items } = req.body;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        await conn.execute(
            `UPDATE tbl_proforma SET pro_date=?, pro_cus_name=?, pro_cus_address=?, pro_contact=?, pro_ref=?, pro_type_loan=?, pro_executive=?, pro_vehi_tax_total=?, pro_vehi_sgst_total=?, pro_vehi_cgst_total=?, pro_vehi_cess_total=?, pro_vehicle_total=?, pro_missal1=?, pro_missal1_amt=?, pro_missal2=?, pro_missal2_amt=?, pro_less=?, pro_grand_total=? WHERE pro_id=?`,
            [
                proformaDate || new Date(), customerName || '', address || '', phone || '', reference || '', paymentMode || 'Cash', executive || '',
                totals?.taxable || 0, totals?.sgst || 0, totals?.cgst || 0, totals?.cess || 0, totals?.amount || 0,
                missell1 || '', missell1Amount || 0, missell2 || '', missell2Amount || 0, lessAmount || 0,
                totalAmount || totals?.grandTotal || 0, req.params.id
            ]
        );
        if (items && items.length) {
            await conn.execute('DELETE FROM tbl_proforma_item WHERE proforma_id = ?', [req.params.id]);
            for (const item of items) {
                await conn.execute(
                    `INSERT INTO tbl_proforma_item (proforma_id, pro_product_id, pro_product_code, pro_product_descr,
                     pro_prduct_bas_amt, pro_product_qty, product_taxable_amt, pro_product_sgst, pro_product_cgst, pro_total, product_cess_amt)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [req.params.id, item.productId || 0, item.productCode || '', item.productDesc || '',
                    item.baseAmount || 0, item.qty || 1, item.taxableAmount || 0, item.sgst || 0, item.cgst || 0, item.total || 0, item.cess || 0]
                );
            }
        }
        await conn.commit();
        res.json({ success: true, message: 'Proforma updated' });
    } catch (err) { await conn.rollback(); console.error(err); res.status(500).json({ success: false, message: 'Failed to update proforma' }); }
    finally { conn.release(); }
};

const createProformaPdf = async (req, res) => {
    try {
        const [proRows] = await db.execute(
            `SELECT tbl_proforma.*, tbl_branch.* FROM tbl_proforma
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_proforma.pro_branch WHERE pro_id = ?`, [req.params.id]);

        if (!proRows.length) return res.status(404).json({ success: false, message: 'Proforma not found' });
        const data = proRows[0];

        const [items] = await db.execute('SELECT * FROM tbl_proforma_item WHERE proforma_id = ?', [req.params.id]);

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        let filename = `Proforma_${data.pro_quot_no}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        doc.pipe(res);

        // --- Header Image/Logo Placeholder ---
        doc.font('Times-Bold').fontSize(7.5).text('Branch Address:', 40, 30);
        doc.font('Times-Bold').fontSize(8.5).text(data.branch_name || '', 40, 42);
        doc.font('Times-Roman').fontSize(7).text(data.branch_address ? data.branch_address.replace(/\r/g, '') : '');
        // doc.font('Times-Roman').fontSize(7).text(data.pro_cus_address ? data.pro_cus_address.replace(/\r/g, '') : '', 40, 54, { width: 200, lineGap: -1 });
        doc.text(`PH : ${data.branch_ph || ''}`, 40, doc.y + 1);

        doc.font('Times-Bold').fontSize(7).text(`Code: 32 Kerala [State Code :32]`, 250, 54);

        doc.fontSize(18).font('Times-Bold').text('KTM', 450, 30, { align: 'right' });

        doc.font('Times-Bold').fontSize(7.5).text(`GSTIN:`, 40, 105);
        doc.font('Times-Bold').fontSize(9).text(data.branch_gstin || '', 40, 116);

        doc.fontSize(12).text('PROFORMA INVOICE (Vehicle)', 200, 105, { align: 'center' });

        doc.moveTo(40, 130).lineTo(560, 130).stroke();

        // --- Details Section ---
        let detailY = 140;
        doc.font('Times-Bold').fontSize(8);
        doc.text('Quotation No.', 40, detailY);
        doc.font('Times-Roman').text(`: ${data.pro_quot_no}`, 120, detailY);
        doc.font('Times-Bold').text('Quotation Date', 380, detailY);
        doc.font('Times-Roman').text(`: ${data.pro_date ? new Date(data.pro_date).toLocaleDateString('en-GB') : ''}`, 480, detailY);

        detailY += 12;
        doc.font('Times-Bold').text('Billed TO', 40, detailY);
        doc.font('Times-Roman').text(`: ${data.pro_cus_name}`, 120, detailY);
        doc.font('Times-Bold').text('Reference', 380, detailY);
        doc.font('Times-Roman').text(`: ${data.pro_ref || ''}`, 480, detailY);

        detailY += 12;
        doc.font('Times-Roman').text(`  Mobile : ${data.pro_contact || ''}`, 120, detailY);
        doc.font('Times-Bold').text('Payment Mode.', 380, detailY);
        doc.font('Times-Roman').text(`: ${data.pro_type_loan || ''}`, 480, detailY);

        detailY += 12;
        doc.font('Times-Roman').text(`  ${data.pro_cus_address ? data.pro_cus_address.replace(/\r/g, '').replace(/\n/g, ' ') : ''}`, 120, detailY, { width: 250 });
        doc.font('Times-Bold').text('Executive.', 380, detailY);
        doc.font('Times-Roman').text(`: ${data.pro_executive || ''}`, 480, detailY);

        // Position INDIA after the address block dynamically
        doc.font('Times-Roman').moveDown(1).text(`  INDIA`, 120, Math.max(detailY + 12, doc.y));

        doc.moveTo(40, Math.max(detailY + 25, doc.y + 5)).lineTo(560, Math.max(detailY + 25, doc.y + 5)).stroke();
        let tableDividerY = Math.max(detailY + 25, doc.y + 5);

        // --- Table Section ---
        let tableY = tableDividerY + 10;
        const col = {
            sl: 40, pcode: 75, desc: 120, rate: 215, qty: 265, taxable: 305, sgst: 365, cgst: 420, cess: 475, total: 515, end: 560
        };

        const drawTableLines = (y, height) => {
            doc.rect(col.sl, y, col.end - col.sl, height).stroke();
            doc.moveTo(col.pcode, y).lineTo(col.pcode, y + height).stroke();
            doc.moveTo(col.desc, y).lineTo(col.desc, y + height).stroke();
            doc.moveTo(col.rate, y).lineTo(col.rate, y + height).stroke();
            doc.moveTo(col.qty, y).lineTo(col.qty, y + height).stroke();
            doc.moveTo(col.taxable, y).lineTo(col.taxable, y + height).stroke();
            doc.moveTo(col.sgst, y).lineTo(col.sgst, y + height).stroke();
            doc.moveTo(col.cgst, y).lineTo(col.cgst, y + height).stroke();
            doc.moveTo(col.cess, y).lineTo(col.cess, y + height).stroke();
            doc.moveTo(col.total, y).lineTo(col.total, y + height).stroke();
        };

        doc.font('Times-Bold').fontSize(7.5);
        doc.rect(col.sl, tableY, col.end - col.sl, 25).stroke();
        doc.text('SL.No.', col.sl + 2, tableY + 5);
        doc.text('PRODUCT\nCODE', col.pcode + 2, tableY + 5);
        doc.text('DESCRIPTION', col.desc + 2, tableY + 5);
        doc.text('RATE', col.rate + 2, tableY + 5);
        doc.text('QTY', col.qty + 2, tableY + 5);
        doc.text('TAXABLE\nAMOUNT', col.taxable + 2, tableY + 5);
        doc.text('SGST/\nUTGST', col.sgst + 2, tableY + 5);
        doc.text('CGST', col.cgst + 2, tableY + 5);
        doc.text('CESS', col.cess + 2, tableY + 5);
        doc.text('AMOUNT', col.total + 2, tableY + 5);

        doc.moveTo(col.pcode, tableY).lineTo(col.pcode, tableY + 25).stroke();
        doc.moveTo(col.desc, tableY).lineTo(col.desc, tableY + 25).stroke();
        doc.moveTo(col.rate, tableY).lineTo(col.rate, tableY + 25).stroke();
        doc.moveTo(col.qty, tableY).lineTo(col.qty, tableY + 25).stroke();
        doc.moveTo(col.taxable, tableY).lineTo(col.taxable, tableY + 25).stroke();
        doc.moveTo(col.sgst, tableY).lineTo(col.sgst, tableY + 25).stroke();
        doc.moveTo(col.cgst, tableY).lineTo(col.cgst, tableY + 25).stroke();
        doc.moveTo(col.cess, tableY).lineTo(col.cess, tableY + 25).stroke();
        doc.moveTo(col.total, tableY).lineTo(col.total, tableY + 25).stroke();

        tableY += 25;
        doc.font('Times-Roman').fontSize(8);
        items.forEach((item, idx) => {
            let rowH = 25;
            drawTableLines(tableY, rowH);
            doc.text(idx + 1, col.sl + 5, tableY + 7);
            doc.text(item.pro_product_code || '', col.pcode + 2, tableY + 7);
            doc.text(item.pro_product_descr || '', col.desc + 2, tableY + 7, { width: col.rate - col.desc - 4 });
            doc.text(parseFloat(item.pro_prduct_bas_amt || 0).toFixed(2), col.rate, tableY + 7, { width: col.qty - col.rate - 2, align: 'right' });
            doc.text(item.pro_product_qty || '', col.qty + 5, tableY + 7);
            doc.text(parseFloat(item.product_taxable_amt || 0).toFixed(2), col.taxable, tableY + 7, { width: col.sgst - col.taxable - 2, align: 'right' });
            doc.text(parseFloat(item.pro_product_sgst || 0).toFixed(2), col.sgst, tableY + 7, { width: col.cgst - col.sgst - 2, align: 'right' });
            doc.text(parseFloat(item.pro_product_cgst || 0).toFixed(2), col.cgst, tableY + 7, { width: col.cess - col.cgst - 2, align: 'right' });
            doc.text(parseFloat(item.product_cess_amt || 0).toFixed(2), col.cess, tableY + 7, { width: col.total - col.cess - 2, align: 'right' });
            doc.text(parseFloat(item.pro_total || 0).toFixed(2), col.total, tableY + 7, { width: col.end - col.total - 2, align: 'right' });
            tableY += rowH;
        });

        doc.font('Times-Bold');
        doc.rect(col.sl, tableY, col.end - col.sl, 15).stroke();
        doc.text('TOTAL', col.qty, tableY + 4);
        doc.text(parseFloat(data.pro_vehi_tax_total || 0).toFixed(2), col.taxable, tableY + 4, { width: col.sgst - col.taxable - 2, align: 'right' });
        doc.text(parseFloat(data.pro_vehi_sgst_total || 0).toFixed(2), col.sgst, tableY + 4, { width: col.cgst - col.sgst - 2, align: 'right' });
        doc.text(parseFloat(data.pro_vehi_cgst_total || 0).toFixed(2), col.cgst, tableY + 4, { width: col.cess - col.cgst - 2, align: 'right' });
        doc.text(parseFloat(data.pro_vehi_cess_total || 0).toFixed(2), col.cess, tableY + 4, { width: col.total - col.cess - 2, align: 'right' });
        doc.text(parseFloat(data.pro_vehicle_total || 0).toFixed(2), col.total, tableY + 4, { width: col.end - col.total - 2, align: 'right' });

        doc.moveTo(col.taxable, tableY).lineTo(col.taxable, tableY + 15).stroke();
        doc.moveTo(col.sgst, tableY).lineTo(col.sgst, tableY + 15).stroke();
        doc.moveTo(col.cgst, tableY).lineTo(col.cgst, tableY + 15).stroke();
        doc.moveTo(col.cess, tableY).lineTo(col.cess, tableY + 15).stroke();
        doc.moveTo(col.total, tableY).lineTo(col.total, tableY + 15).stroke();

        tableY += 15;

        const drawSummaryRow = (label, value, y) => {
            doc.rect(col.taxable, y, col.total - col.taxable, 12).stroke();
            doc.rect(col.total, y, col.end - col.total, 12).stroke();
            doc.font('Times-Bold').text(label, col.taxable + 2, y + 2.5);
            doc.font('Times-Roman').text(parseFloat(value || 0).toFixed(2), col.total, y + 2.5, { width: col.end - col.total - 2, align: 'right' });
        };

        const subtotal = parseFloat(data.pro_vehicle_total || 0) + parseFloat(data.pro_missal1_amt || 0) + parseFloat(data.pro_missal2_amt || 0) - parseFloat(data.pro_less || 0);
        const roundedGrandTotal = Math.round(subtotal);
        const roundOff = (subtotal - roundedGrandTotal).toFixed(2);

        drawSummaryRow('Round Off', roundOff, tableY);
        tableY += 12;
        drawSummaryRow(data.pro_missal1 || 'Misselaneous1-', data.pro_missal1_amt, tableY);
        tableY += 12;
        drawSummaryRow(data.pro_missal2 || 'Misselaneous2-', data.pro_missal2_amt, tableY);
        tableY += 12;
        drawSummaryRow('Less', data.pro_less, tableY);
        tableY += 12;

        doc.rect(col.taxable, tableY, col.total - col.taxable, 12).stroke();
        doc.rect(col.total, tableY, col.end - col.total, 12).stroke();
        doc.font('Times-Bold').text('Total Amount', col.taxable + 2, tableY + 2.5);
        doc.text(parseFloat(roundedGrandTotal).toFixed(2), col.total, tableY + 2.5, { width: col.end - col.total - 2, align: 'right' });

        tableY += 12;
        doc.font('Times-Bold').fontSize(9);

        // Make left column smaller width
        const leftWidth = 120;
        const rightWidth = col.end - col.sl - leftWidth;

        // Smaller height for left column
        const rowHeight = 20;

        // LEFT COLUMN (Smaller width)
        doc.rect(col.sl, tableY, leftWidth, rowHeight).stroke();

        // RIGHT COLUMN (Bigger width)
        doc.rect(col.sl + leftWidth, tableY, rightWidth, rowHeight).stroke();

        // Text
        doc.text('AMOUNT IN WORDS', col.sl + 5, tableY + 6);

        // Bigger text for amount
        doc.fontSize(10);
        doc.text(
            `RS: ${numberToWords(Math.round(data.pro_grand_total || 0))}`,
            col.sl + leftWidth + 5,
            tableY + 6,
            { width: rightWidth - 10 }
        );

        tableY += 35;
        doc.text('Tax amount payable on reverse charges (in Rs.) : Nil', col.sl, tableY);

        tableY += 60;
        doc.fontSize(8);
        doc.text('Sign of Customer Or His Agent', col.sl, tableY);

        doc.font('Times-Bold').fontSize(9).text('Note :The Finance amount may please be raised\nvide DD or cheque in favour of SARATHY MOTORS\npayable at Kollam.\nA/c No : 0000 037 740 159725\nBranch : SBI Commercial Branch, Kollam\nIFS Code : SBIN0004063', 180, tableY, { align: 'center', width: 250 });

        doc.font('Times-Bold').fontSize(9).text('SARATHY MOTORS', col.end - 120, tableY, { width: 120, align: 'center' });
        doc.font('Times-Roman').fontSize(8).text('Authorised Signatory', col.end - 120, tableY + 12, { width: 120, align: 'center' });

        doc.moveTo(col.sl, tableY + 80).lineTo(col.end, tableY + 80).dash(2, { space: 2 }).stroke().undash();

        tableY += 100;
        doc.font('Times-Bold').fontSize(14).text('Terms & Conditions', 40, tableY, { align: 'center', underline: true });
        doc.moveDown(1);
        doc.font('Times-Roman').fontSize(7.5);
        const terms = [
            'The price applicable shall be that prevailing on the date of delivery irrespective of the price quoted in this Proforma invoice payment made by the buyer.',
            'The Price quoted in this Proforma invoice is for delivery Ex-our showroom.',
            '"All promises of delivery are given in good faith." However the buyer agrees that no claim will be made against the supplier in the event of:\na. Failure of sellers to make any delivery when due owing to unforeseen circumstances beyond their control such as strikes, Accidents, Fire, War, Sabotage, Forced shut downs,Floods, Riots, etc.\nb. Non-availability of transport facility interruption of transportation or delays or inadequacy or shortage of failure of supply of vehicles from whatever causes arising.',
            'The seller reserve the right to revise the price quoted in this Proforma invoice without any notice in the event of any price increase by the manufacturer.',
            'All the orders are subject to Government Sales Tax, other taxes & Levies as and when applicable.',
            'The seller reserves the right to demanding and advance before executing the order.',
            'All orders placed by the buyers based on this Proforma Invoice shall be subject to the seller\'s acceptance and sellers fill be at liberty to accept or refuse any other in full or part without assigning any reason whatsoever.',
            'The buyer shall have no claim against the late delivery or non delivery of the vehicle on any account of whatsoever.',
            'In the event of buyer\'s failure to remit payment, take delivery of the vehicle by the specified date, the buyer agrees to pay all the expenses and losses suffered to the seller on account of such failure.',
            'Your advance remittance will be treated as a token of your acceptance being ready to take delivery of the vehicle and remittance should be made at your own risk.',
            'No interest will be paid to the advance deposited by the buyer under any Circumstances.',
            'All Disputes arising out of this contract shall be subject to jurisdiction of the Court of KOLLAM only.'
        ];
        terms.forEach((term, i) => {
            doc.text(`${i + 1}`, 60, doc.y);
            doc.text(term, 80, doc.y - 8);
            doc.moveDown(0.5);
        });

        const now = new Date();
        doc.font('Times-Roman').fontSize(7).text(`Printed On: ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}`, col.sl, 800);
        doc.text('Page 1/1', col.end - 45, 800);

        doc.end();

    } catch (err) {
        console.error('Proforma PDF Error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate Proforma PDF' });
    }
};

const getProformaExecutives = async (req, res) => {
    const branchName = req.query.branchName;
    try {
        let rows = [];
        if (branchName) {
            [rows] = await db.execute(
                `SELECT emp_id, e_first_name FROM tbl_employee
                 WHERE e_branch = ? AND e_designation = 'Executive' ORDER BY e_first_name`, [branchName]
            );
        } else {
            [rows] = await db.execute(
                `SELECT emp_id, e_first_name FROM tbl_employee WHERE e_designation = 'Executive' ORDER BY e_first_name`
            );
        }
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch executives' });
    }
};

const createProformaPdfByNo = async (req, res) => {
    try {
        const [records] = await db.execute(
            `SELECT pro_id FROM tbl_proforma WHERE pro_quot_no = ?`, [req.params.no]
        );
        if (!records.length) return res.status(404).json({ success: false, message: 'Proforma not found' });
        req.params.id = records[0].pro_id;
        return createProformaPdf(req, res);
    } catch (err) {
        console.error('Proforma PDF Error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate Proforma PDF' });
    }
};

module.exports = { getNextProformaNo, listProformas, getProforma, saveProforma, updateProforma, createProformaPdf, createProformaPdfByNo, getProformaExecutives };
