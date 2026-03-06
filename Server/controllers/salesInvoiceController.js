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
async function getNextNo(branchId) {
    const year = new Date().getFullYear().toString();
    const [rows] = await db.execute('SELECT MAX(inv_no) as last_no FROM tbl_invoice_labour WHERE inv_branch = ?', [branchId]);
    const lastNo = rows[0].last_no;
    if (!lastNo) return `CI${year}${branchId}${padSerial(1)}`;
    const lastSerial = parseInt(lastNo.slice(-5), 10) || 0;
    const lastYear = lastNo.substring(2, 6);
    return `CI${year}${branchId}${padSerial(lastYear === year ? lastSerial + 1 : 1)}`;
}

const getNextInvoiceNo = async (req, res) => {
    const branchId = req.query.branchId;

    if (!branchId) {
        return res.status(400).json({
            success: false,
            message: 'Branch ID is required'
        });
    }

    try {
        const currentYear = new Date().getFullYear();

        // 🔹 Fetch last invoice from tbl_invoice_labour
        const [rows] = await db.execute(
            `
            SELECT inv_no
            FROM tbl_invoice_labour
            WHERE inv_branch = ?
              AND YEAR(inv_inv_date) = ?
            ORDER BY inv_id DESC
            LIMIT 1
            `,
            [branchId, currentYear]
        );

        let nextRunningNumber = 1;

        if (rows.length > 0 && rows[0].inv_no) {
            const lastInvoiceNo = rows[0].inv_no;

            // Extract last 6 digits safely
            const lastNumber = parseInt(lastInvoiceNo.slice(-6)) || 0;
            nextRunningNumber = lastNumber + 1;
        }

        const formattedRunningNumber = nextRunningNumber
            .toString()
            .padStart(6, '0');

        // Format → VSI202610000001
        const newInvoiceNumber =
            `VSI${currentYear}${branchId}${formattedRunningNumber}`;

        return res.json({
            success: true,
            invoiceNo: newInvoiceNumber
        });

    } catch (error) {
        console.error('getNextInvoiceFromProformaNumber error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate invoice number'
        });
    }
};

const getAllLabourCodes = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT labour_id, labour_title, labour_code, sale_price, cgst, sgst, cess FROM tbl_labour_code ORDER BY labour_title');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch labour codes' });
    }
};

const getLabourDetails = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM tbl_labour_code WHERE labour_id = ?', [req.params.labourId]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Labour not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch labour details' });
    }
};

const getChassisRecords = async (req, res) => {
    const branchId = req.query.branchId || null;
    try {
        let sql = `
            SELECT 
                pi.chassis_no AS inv_chassis,
                pi.engine_no AS in_engine,
                pi.materialName AS inv_vehicle,
                pi.product_id AS inv_vehicle_code,
                pi.color_name AS inv_color,
                pi.item_hsn_code AS inv_hsncode,
                tlc.sale_price AS basic_amount,
                0 AS discount_amount,
                0 AS taxable_amount,
                0 AS sgst,
                0 AS cgst,
                0 AS cess,
                0 AS inv_total,
                pb.purch_branchId AS inv_branch,
                pb.pucha_vendorName AS inv_cus,
                til.inv_no,
                til.inv_id
            FROM purchaseitem pi
            LEFT JOIN purchaseitembill pb ON pi.purchaseItemBillId = pb.purchaseItemBillId
            LEFT JOIN tbl_labour_code tlc ON pi.product_id = tlc.labour_id
            LEFT JOIN tbl_invoice_labour til ON pi.chassis_no = til.inv_chassis
            WHERE pi.chassis_no IS NOT NULL 
              AND TRIM(pi.chassis_no) <> ''
              AND pi.item_status = 'Available'
        `;
        const params = [];

        if (branchId) {
            sql += ' AND pb.purch_branchId = ?';
            params.push(branchId);
        }

        sql += ' ORDER BY inv_id DESC';
        const [rows] = params.length ? await db.execute(sql, params) : await db.execute(sql);

        // Keep only latest row for each chassis and normalize keys used by frontend.
        const byChassis = new Map();
        for (const r of rows || []) {
            const key = (r?.inv_chassis || '').toString().trim().toLowerCase();
            if (!key) continue;
            if (!byChassis.has(key)) byChassis.set(key, r);
        }

        const data = Array.from(byChassis.values()).map((r) => ({
            ...r,
            inv_id: r.inv_id,
            inv_no: r.inv_no || '',
            inv_branch: r.inv_branch ?? null,
            inv_inv_date: r.inv_inv_date || r.inv_date || null,
            inv_chassis: (r.inv_chassis || '').toString().trim(),
            in_engine: r.in_engine || r.inv_engine_no || '',
            inv_vehicle: r.inv_vehicle || r.vehicle || '',
            inv_vehicle_code: r.inv_vehicle_code || r.inv_product_id || '',
            inv_color: r.inv_color || r.color_name || '',
            inv_hypothication: r.inv_hypothication || '',
            inv_hsncode: r.inv_hsncode || r.hsn_code || '',
            inv_basic_amt: r.inv_basic_amt ?? r.basic_amount ?? 0,
            inv_discount_amt: r.inv_discount_amt ?? r.discount_amount ?? 0,
            inv_taxable_amt: r.inv_taxable_amt ?? r.taxable_amount ?? 0,
            inv_sgst: r.inv_sgst ?? r.sgst ?? 0,
            inv_cgst: r.inv_cgst ?? r.cgst ?? 0,
            inv_cess: r.inv_cess ?? r.cess ?? 0,
            inv_total: r.inv_total ?? 0,
            inv_total_amount: r.inv_total_amount ?? r.inv_total ?? 0,
            inv_gstin: r.inv_gstin || '',
            inv_advisername: r.inv_advisername || '',
            inv_cus: r.inv_cus || ''
        }));

        res.json({ success: true, data });
    } catch (err) {
        console.error('getChassisRecords error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch chassis records' });
    }
};

const getHypothecationOptions = async (_req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT icompany_name
             FROM tbl_insurance_company
             WHERE TRIM(COALESCE(icompany_name, '')) <> ''
             ORDER BY icompany_name`
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getHypothecationOptions error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch hypothecation options' });
    }
};

const listInvoices = async (req, res) => {
    const branchId = req.query.branchId || null;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const search = (req.query.search || '').trim();
    const offset = (page - 1) * limit;

    try {
        let conditions = ["tbl_invoice_labour.inv_type != 'Purchase'"];
        let params = [];

        if (branchId) {
            conditions.push('tbl_invoice_labour.inv_branch = ?');
            params.push(branchId);
        }
        if (search) {
            conditions.push('(inv_no LIKE ? OR inv_cus LIKE ? OR inv_chassis LIKE ? OR inv_vehicle LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const mainSql = `SELECT
                tbl_invoice_labour.inv_id,
                tbl_invoice_labour.inv_no,
                tbl_invoice_labour.inv_inv_date,
                tbl_invoice_labour.inv_cus,
                tbl_invoice_labour.inv_cus_addres,
                tbl_invoice_labour.inv_pincode,
                tbl_invoice_labour.inv_pho,
                tbl_invoice_labour.inv_hypothication,
                tbl_invoice_labour.inv_chassis,
                tbl_invoice_labour.in_engine,
                tbl_invoice_labour.inv_vehicle,
                tbl_invoice_labour.inv_vehicle_code,
                tbl_invoice_labour.inv_color,
                tbl_invoice_labour.inv_hsncode,
                tbl_invoice_labour.inv_basic_amt,
                tbl_invoice_labour.inv_discount_amt,
                tbl_invoice_labour.inv_taxable_amt,
                tbl_invoice_labour.inv_sgst,
                tbl_invoice_labour.inv_cgst,
                tbl_invoice_labour.inv_cess,
                tbl_invoice_labour.inv_total,
                tbl_invoice_labour.inv_gstin,
                tbl_invoice_labour.inv_advisername,
                tbl_invoice_labour.inv_type,
                tbl_invoice_labour.status,
                tbl_branch.branch_name
             FROM tbl_invoice_labour
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_invoice_labour.inv_branch
             ${where}
             ORDER BY inv_id DESC
             LIMIT ${limit} OFFSET ${offset}`;

        const countSql = `SELECT COUNT(*) as total
             FROM tbl_invoice_labour
             ${where}`;

        const [rows] = params.length ? await db.execute(mainSql, params) : await db.execute(mainSql);
        const [countRows] = params.length ? await db.execute(countSql, params) : await db.execute(countSql);

        res.json({ success: true, data: rows, total: countRows[0].total, page, limit });

    } catch (err) {
        console.error('listInvoices error:', err.message || err);
        res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
    }
};

const createSalesPdf = async (req, res) => {
    try {
        const [records] = await db.execute(
            `SELECT inv.*, b.branch_name, b.branch_address, b.branch_ph, b.branch_gstin 
             FROM tbl_invoice_labour inv
             LEFT JOIN tbl_branch b ON b.b_id = inv.inv_branch
             WHERE inv.inv_id = ?`, [req.params.id]
        );

        if (!records.length) return res.status(404).json({ success: false, message: 'Invoice not found' });
        const data = records[0];

        const items = [{
            model: data.inv_vehicle_code || '',
            desc: data.inv_vehicle || '',
            hsn: data.inv_hsncode || '',
            rate: parseFloat(data.inv_basic_amt || 0),
            disc: parseFloat(data.inv_discount_amt || 0),
            taxable: parseFloat(data.inv_taxable_amt || 0),
            sgst: parseFloat(data.inv_sgst || 0),
            cgst: parseFloat(data.inv_cgst || 0),
            cess: parseFloat(data.inv_cess || 0),
            amount: parseFloat(data.inv_total || 0)
        }];

        const doc = new PDFDocument({ margin: 30, size: 'A4', bufferPages: true });
        let filename = `Sales_${data.inv_no}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        doc.pipe(res);

        const col = {
            sl: 40, model: 75, desc: 130, rate: 210, qty: 260, disc: 290, taxable: 340, sgst: 390, cgst: 460, cess: 510, amt: 535, end: 575
        };

        const drawHeaders = (isFirstPage) => {
            if (isFirstPage) {
                // --- Header Section ---
                doc.font('Times-Bold').fontSize(7.5).text('Branch Address:', 40, 30);
                doc.font('Times-Bold').fontSize(8.5).text(data.branch_name || '', 40, 42);

                const branchAddr = data.branch_address ? data.branch_address.replace(/\r/g, '') : '';
                const branchAddrH = doc.heightOfString(branchAddr, { width: 220, size: 7 });
                doc.font('Times-Roman').fontSize(7).text(branchAddr, 40, 54, { width: 220, lineGap: -1 });

                let currentY = 54 + branchAddrH + 2;
                doc.text(`PH : ${data.branch_ph || ''}`, 40, currentY);
                currentY += 10;

                doc.font('Times-Bold').fontSize(10).text('SARATHY BIKES PVT LTD', 240, 30, { width: 200, align: 'center' });
                doc.font('Times-Roman').fontSize(7.5).text('Sarathy Bajaj Pallimukku Kollam Kerala State\nCode: 32 Kerala [State Code :32]', 240, 42, { width: 200, align: 'center' });

                doc.fontSize(25).font('Times-Bold').text('KTM', 450, 30, { width: 125, align: 'right' });

                doc.font('Times-Bold').fontSize(7.5).text(`GSTIN:`, 40, 105);
                doc.font('Times-Bold').fontSize(9).text(data.branch_gstin || '32ABECS8915L1Z0', 40, 116);

                doc.fontSize(16).text('TAX INVOICE', 240, 105, { width: 200, align: 'center' });

                doc.moveTo(40, 130).lineTo(575, 130).lineWidth(1).stroke();

                // --- Details Section ---
                let detailY = 140;
                const fieldX1 = 40, fieldX2 = 120, fieldX3 = 390, fieldX4 = 475;
                doc.font('Times-Bold').fontSize(7.5);

                const drawFieldRow = (label1, val1, label2, val2, y, bold1 = false, bold2 = false) => {
                    doc.font('Times-Bold').text(label1, fieldX1, y);
                    doc.text(':', fieldX2 - 10, y);
                    doc.font(bold1 ? 'Times-Bold' : 'Times-Roman').text(val1 || '', fieldX2, y, { width: 250 });

                    doc.font('Times-Bold').text(label2, fieldX3, y);
                    doc.text(':', fieldX4 - 10, y);
                    doc.font(bold2 ? 'Times-Bold' : 'Times-Roman').text(val2 || '', fieldX4, y, { width: 100 });
                };

                drawFieldRow('Invoice No.', data.inv_no, 'CDMS No', data.inv_cdms_no || '', detailY, true, false);
                detailY += 12;
                drawFieldRow('Invoice Date', data.inv_inv_date ? new Date(data.inv_inv_date).toLocaleDateString('en-GB') : '', 'Receipt No.', data.inv_receipt_no || '', detailY);
                detailY += 12;

                doc.font('Times-Bold').text('Billed TO', fieldX1, detailY);
                doc.text(':', fieldX2 - 10, detailY);
                doc.font('Times-Bold').text(data.inv_cus || '', fieldX2, detailY);

                doc.font('Times-Bold').text('Registration', fieldX3, detailY);
                doc.text(':', fieldX4 - 10, detailY);
                doc.font('Times-Roman').text(data.inv_regn || 'KOLLAM', fieldX4, detailY);

                detailY += 12;
                doc.font('Times-Roman').text(`Mobile : ${data.inv_pho || ''}`, fieldX2, detailY);
                doc.font('Times-Bold').text('Sale Date', fieldX3, detailY);
                doc.text(':', fieldX4 - 10, detailY);
                doc.font('Times-Roman').text(data.inv_inv_date ? new Date(data.inv_inv_date).toLocaleDateString('en-GB') : '', fieldX4, detailY);

                detailY += 12;
                const billedAddr = `${data.inv_cus_addres || ''}\n${data.inv_place || ''} ${data.inv_pincode || ''}\nPincode : ${data.inv_pincode || ''}\nKerala[State Code :32] INDIA`;
                const billedAddrH = doc.heightOfString(billedAddr, { width: 250, size: 7.5 });
                doc.font('Times-Roman').text(billedAddr, fieldX2, detailY, { width: 250 });

                // Right side fields continue while address is drawing
                doc.font('Times-Bold').text('Hypothecation', fieldX3, detailY);
                doc.text(':', fieldX4 - 10, detailY);
                doc.font('Times-Bold').text(data.inv_hypothication || 'BAJAJ FINANCE LTD', fieldX4, detailY, { width: 100 });

                const hypH = doc.heightOfString(data.inv_hypothication || 'BAJAJ FINANCE LTD', { width: 100, size: 7.5 });
                let rightY = detailY + Math.max(12, hypH);

                doc.font('Times-Bold').text('Fin Dues', fieldX3, rightY);
                doc.text(':', fieldX4 - 10, rightY);
                doc.font('Times-Roman').text(data.inv_finance_dues || '', fieldX4, rightY);
                rightY += 12;

                doc.font('Times-Bold').text('Chassis No.', fieldX3, rightY);
                doc.text(':', fieldX4 - 10, rightY);
                doc.font('Times-Bold').text(data.inv_chassis || '', fieldX4, rightY);
                rightY += 12;

                detailY = Math.max(detailY + billedAddrH + 4, rightY);

                drawFieldRow('Father/Husband', data.inv_cus_father_hus || '', 'Engine No.', data.in_engine || '', detailY, false, true);
                detailY += 12;
                drawFieldRow('Mobile No.', data.inv_pho || '', 'Color', data.inv_color || '', detailY);
                detailY += 12;
                drawFieldRow('Executive Name', data.inv_advisername || '', '', '', detailY, true);
                detailY += 12;
                drawFieldRow('Invoice Type', data.inv_type || '01', '', '', detailY);
                detailY += 12;
                drawFieldRow('Customer GSTIN', data.inv_gstin || '', '', '', detailY);

                detailY += 18;
                doc.moveTo(40, detailY).lineTo(575, detailY).lineWidth(1).stroke();
                return detailY + 10;
            } else {
                return 40;
            }
        };

        const drawTableLines = (y, height) => {
            doc.rect(col.sl, y, col.end - col.sl, height).lineWidth(0.5).stroke();
            doc.moveTo(col.model, y).lineTo(col.model, y + height).stroke();
            doc.moveTo(col.desc, y).lineTo(col.desc, y + height).stroke();
            doc.moveTo(col.rate, y).lineTo(col.rate, y + height).stroke();
            doc.moveTo(col.qty, y).lineTo(col.qty, y + height).stroke();
            doc.moveTo(col.disc, y).lineTo(col.disc, y + height).stroke();
            doc.moveTo(col.taxable, y).lineTo(col.taxable, y + height).stroke();
            doc.moveTo(col.sgst, y).lineTo(col.sgst, y + height).stroke();
            doc.moveTo(col.cgst, y).lineTo(col.cgst, y + height).stroke();
            doc.moveTo(col.cess, y).lineTo(col.cess, y + height).stroke();
            doc.moveTo(col.amt, y).lineTo(col.amt, y + height).stroke();
        };

        const drawTableHeader = (y) => {
            doc.font('Times-Bold').fontSize(7);
            const h = 30;
            doc.rect(col.sl, y, col.end - col.sl, h).lineWidth(1).stroke();

            doc.text('SL.No.', col.sl + 2, y + 10);
            doc.text('Model', col.model + 2, y + 10);
            doc.text('DESCRIPTION', col.desc + 2, y + 10);
            doc.text('RATE', col.rate + 2, y + 10);
            doc.text('QTY', col.qty + 2, y + 10);
            doc.text('DISC', col.disc + 2, y + 10);
            doc.text('TAXABLE\nAMOUNT', col.taxable + 2, y + 5);
            doc.text('SGST/\nUTGST', col.sgst + 2, y + 5);
            doc.text('CGST', col.cgst + 2, y + 10);
            doc.text('CESS', col.cess + 2, y + 10);
            doc.text('AMOUNT', col.amt + 2, y + 10);

            doc.moveTo(col.model, y).lineTo(col.model, y + h).stroke();
            doc.moveTo(col.desc, y).lineTo(col.desc, y + h).stroke();
            doc.moveTo(col.rate, y).lineTo(col.rate, y + h).stroke();
            doc.moveTo(col.qty, y).lineTo(col.qty, y + h).stroke();
            doc.moveTo(col.disc, y).lineTo(col.disc, y + h).stroke();
            doc.moveTo(col.taxable, y).lineTo(col.taxable, y + h).stroke();
            doc.moveTo(col.sgst, y).lineTo(col.sgst, y + h).stroke();
            doc.moveTo(col.cgst, y).lineTo(col.cgst, y + h).stroke();
            doc.moveTo(col.cess, y).lineTo(col.cess, y + h).stroke();
            doc.moveTo(col.amt, y).lineTo(col.amt, y + h).stroke();
            return y + h;
        };

        let currentY = drawHeaders(true);
        currentY = drawTableHeader(currentY);

        doc.font('Times-Roman').fontSize(7.5);
        items.forEach((item, idx) => {
            const desc = (item.desc || '') + (item.hsn ? ` / ${item.hsn}` : '');
            const descH = doc.heightOfString(desc, { width: col.rate - col.desc - 4, size: 7.5 });
            let rowH = Math.max(25, descH + 10);

            if (currentY + rowH > 750) {
                doc.addPage();
                currentY = drawTableHeader(40);
                doc.font('Times-Roman').fontSize(7.5);
            }
            drawTableLines(currentY, rowH);
            doc.text(idx + 1, col.sl + 5, currentY + 7);
            doc.text(item.model || '', col.model + 2, currentY + 7);
            doc.text(desc, col.desc + 2, currentY + 7, { width: col.rate - col.desc - 4 });
            doc.text(item.rate.toFixed(0), col.rate, currentY + 7, { width: col.qty - col.rate - 2, align: 'right' });
            doc.text('1', col.qty, currentY + 7, { width: col.disc - col.qty - 2, align: 'right' });
            doc.text(item.disc.toFixed(2), col.disc, currentY + 7, { width: col.taxable - col.disc - 2, align: 'right' });
            doc.text(item.taxable.toFixed(0), col.taxable, currentY + 7, { width: col.sgst - col.taxable - 2, align: 'right' });
            doc.text(item.sgst.toFixed(2), col.sgst, currentY + 7, { width: col.cgst - col.sgst - 2, align: 'right' });
            doc.text(item.cgst.toFixed(2), col.cgst, currentY + 7, { width: col.cess - col.cgst - 2, align: 'right' });
            doc.text(item.cess.toFixed(0), col.cess, currentY + 7, { width: col.amt - col.cess - 2, align: 'right' });
            doc.text(item.amount.toFixed(2), col.amt, currentY + 7, { width: col.end - col.amt - 2, align: 'right' });
            currentY += rowH;
        });

        // --- Totals Section ---
        if (currentY + 120 > 750) {
            doc.addPage();
            currentY = 40;
        }

        doc.font('Times-Bold').fontSize(7.5);
        doc.rect(col.sl, currentY, col.end - col.sl, 12).lineWidth(1).stroke();
        doc.text('TOTAL', col.qty, currentY + 3);

        let totalDisc = items.reduce((a, b) => a + b.disc, 0);
        let totalTaxable = items.reduce((a, b) => a + b.taxable, 0);
        let totalSGST = items.reduce((a, b) => a + b.sgst, 0);
        let totalCGST = items.reduce((a, b) => a + b.cgst, 0);
        let totalCess = items.reduce((a, b) => a + b.cess, 0);
        let totalAmount = items.reduce((a, b) => a + b.amount, 0);

        doc.text(totalDisc.toFixed(2), col.disc, currentY + 3, { width: col.taxable - col.disc - 2, align: 'right' });
        doc.text(totalTaxable.toFixed(0), col.taxable, currentY + 3, { width: col.sgst - col.taxable - 2, align: 'right' });
        doc.text(totalSGST.toFixed(2), col.sgst, currentY + 3, { width: col.cgst - col.sgst - 2, align: 'right' });
        doc.text(totalCGST.toFixed(2), col.cgst, currentY + 3, { width: col.cess - col.cgst - 2, align: 'right' });
        doc.text(totalCess.toFixed(0), col.cess, currentY + 3, { width: col.amt - col.cess - 2, align: 'right' });
        doc.text(totalAmount.toFixed(2), col.amt, currentY + 3, { width: col.end - col.amt - 2, align: 'right' });

        doc.moveTo(col.disc, currentY).lineTo(col.disc, currentY + 12).stroke();
        doc.moveTo(col.taxable, currentY).lineTo(col.taxable, currentY + 12).stroke();
        doc.moveTo(col.sgst, currentY).lineTo(col.sgst, currentY + 12).stroke();
        doc.moveTo(col.cgst, currentY).lineTo(col.cgst, currentY + 12).stroke();
        doc.moveTo(col.cess, currentY).lineTo(col.cess, currentY + 12).stroke();
        doc.moveTo(col.amt, currentY).lineTo(col.amt, currentY + 12).stroke();

        currentY += 12;
        const subtotal = totalAmount;
        const roundedGrandTotal = Math.round(subtotal);
        const roundOff = (roundedGrandTotal - subtotal).toFixed(2);

        const drawSummaryRow = (label, value, y) => {
            doc.rect(col.taxable, y, col.amt - col.taxable, 12).lineWidth(0.5).stroke();
            doc.rect(col.amt, y, col.end - col.amt, 12).lineWidth(0.5).stroke();
            doc.font('Times-Bold').text(label, col.taxable + 2, y + 3);
            doc.font('Times-Roman').text(parseFloat(value || 0).toFixed(2), col.amt, y + 3, { width: col.end - col.amt - 2, align: 'right' });
        };

        drawSummaryRow('Round Off', roundOff, currentY);
        currentY += 12;
        doc.rect(col.taxable, currentY, col.amt - col.taxable, 12).lineWidth(1).stroke();
        doc.rect(col.amt, currentY, col.end - col.amt, 12).lineWidth(1).stroke();
        doc.font('Times-Bold').text('Total Amount', col.taxable + 2, currentY + 3);
        doc.text(parseFloat(roundedGrandTotal).toFixed(2), col.amt, currentY + 3, { width: col.end - col.amt - 2, align: 'right' });

        currentY += 15;
        // Amount in words
        const leftWidth = 130;
        const rightWidth = col.end - col.sl - leftWidth;
        doc.rect(col.sl, currentY, leftWidth, 25).lineWidth(1).stroke();
        doc.rect(col.sl + leftWidth, currentY, rightWidth, 25).lineWidth(1).stroke();
        doc.font('Times-Bold').fontSize(9).text('AMOUNT IN WORDS', col.sl + 5, currentY + 8);
        doc.font('Times-Bold').fontSize(9.5).text(`RS: ${numberToWords(roundedGrandTotal)}`, col.sl + leftWidth + 5, currentY + 8, { width: rightWidth - 10 });

        currentY += 30;
        doc.font('Times-Bold').fontSize(8.5).text('Tax amount payable on reverse charges (in Rs.) : Nil', col.sl, currentY);

        currentY += 60;
        doc.font('Times-Roman').text('Sign of Customer Or His Agent', col.sl, currentY);
        doc.font('Times-Bold').text('SARATHY BIKES PVT LTD', col.end - 150, currentY, { width: 150, align: 'center' });
        doc.font('Times-Bold').fontSize(8.5).text('Authorised Signatory', col.end - 150, currentY + 12, { width: 150, align: 'center' });

        doc.moveTo(col.sl, currentY + 35).lineTo(col.end, currentY + 35).dash(2, { space: 2 }).stroke().undash();

        // Footer & Page numbers
        const totalPages = doc.bufferedPageRange().count;
        for (let i = 0; i < totalPages; i++) {
            doc.switchToPage(i);
            const now = new Date();
            const printedText = `Printed On: ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}`;
            const pageText = `Page ${i + 1}/${totalPages}`;

            // Draw at Y=810 (safe within margin) with lineBreak: false to stay on page
            doc.font('Times-Roman').fontSize(7.5)
                .text(printedText, col.sl, 810, { lineBreak: false });
            doc.text(pageText, col.end - 50, 810, { lineBreak: false });
        }

        doc.end();

    } catch (err) {
        console.error('Sales PDF Error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate Sales PDF' });
    }
};

const createSalesLetterPdf = async (req, res) => {
    try {
        const [records] = await db.execute(
            `SELECT inv.*, lc.*, b.branch_name, b.branch_address, b.branch_ph, pi.p_date
             FROM tbl_invoice_labour inv
             LEFT JOIN tbl_labour_code lc ON lc.labour_code = inv.inv_vehicle_code
             LEFT JOIN tbl_branch b ON b.b_id = inv.inv_branch
             LEFT JOIN purchaseitem pi on pi.chassis_no = inv.inv_chassis
             WHERE inv.inv_id = ?`, [req.params.id]
        );

        if (!records.length) return res.status(404).json({ success: false, message: 'Invoice not found' });
        const data = records[0];

        const doc = new PDFDocument({ margin: 30, size: 'A4', bufferPages: true });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="SalesLetter_${data.inv_no}.pdf"`);
        doc.pipe(res);

        // --- Header ---
        doc.font('Times-Bold').fontSize(7.5).text('SARATHY MOTORS', 40, 40);
        doc.font('Times-Roman').fontSize(7.5).text('Sarathy Bajaj\nPallimukku\nKollam-10\nKerala', 40, 52);

        doc.font('Times-Bold').fontSize(9).text('FORM 21', 400, 40, { width: 150, align: 'right' });
        doc.fontSize(10).text('SALES CERTIFICATE', 400, 52, { width: 150, align: 'right' });
        doc.fontSize(10).text('rule 47 (a) & (b)', 400, 64, { width: 150, align: 'right' });

        let currentY = 150;
        doc.font('Times-Roman').fontSize(8.5).text('Certified that ', 40, currentY, { continued: true });
        doc.font('Times-Bold').text((data.inv_vehicle || '') + ' ', { continued: true });
        doc.font('Times-Roman').text('has been delivered by us ', { continued: true });
        doc.font('Times-Bold').text((data.inv_cus || '') + '  ', { continued: true });
        doc.font('Times-Roman').text('on ', { continued: true });
        doc.font('Times-Bold').text(data.inv_inv_date ? new Date(data.inv_inv_date).toLocaleDateString('en-GB') : '');

        currentY += 25;
        const fieldX1 = 40, fieldX2 = 120;
        const drawField = (label, val, y, isBold = false) => {
            doc.font('Times-Bold').fontSize(7.5).text(label, fieldX1, y);
            doc.text(':', fieldX2 - 10, y);
            doc.font(isBold ? 'Times-Bold' : 'Times-Roman').text(val || '', fieldX2, y, { width: 350 });
        };

        drawField('Sale Letter No.', data.inv_no, currentY); currentY += 12;
        drawField('Invoice Date', data.inv_inv_date ? new Date(data.inv_inv_date).toLocaleDateString('en-GB') : '', currentY); currentY += 12;
        drawField('Name of the Buyer', data.inv_cus || '', currentY, true); currentY += 10;

        const buyerAddr = `Mobile : ${data.inv_pho || ''}\n${(data.inv_cus_addres || '').replace(/\r?\n|\r/g, ' ')}\n${data.inv_place || ''} ${data.inv_pincode || ''}\nKerala[State Code :32] INDIA`;
        doc.font('Times-Roman').fontSize(7.5).text(buyerAddr, fieldX2, currentY, { width: 350 });
        currentY += doc.heightOfString(buyerAddr, { width: 350 }) + 5;

        drawField('Father/Husband', data.inv_cus_father_hus || '', currentY, true); currentY += 12;
        drawField('Mobile No.', data.inv_pho || '', currentY); currentY += 12;
        drawField('Hypothication', data.inv_hypothication || 'BAJAJ FINANCE LTD', currentY, true); currentY += 15;

        doc.font('Times-Bold').fontSize(9).text('The Details of vehicle are given below:-', 40, currentY);
        currentY += 20;

        const specX1 = 40, specX2 = 60, specX3 = 180, specX4 = 230, specX5 = 260;
        const drawSpec = (idx, label, val, y, isBoldVal = false) => {
            doc.font('Times-Roman').fontSize(8.5).text(`${idx}.`, specX1, y);
            doc.text(label, specX2, y);
            doc.text(':-', specX4 - 10, y);
            doc.font(isBoldVal ? 'Times-Bold' : 'Times-Roman').text(val || '', specX5, y, { width: 250 });
            return y + Math.max(12, doc.heightOfString(val || '', { width: 250 }));
        };

        currentY = drawSpec(1, 'Class of Vehicle', data.repair_type || 'MOTORCYCLE WITH GEAR', currentY, true);
        currentY = drawSpec(2, 'Makers Name', 'Bajaj Auto Ltd', currentY, true);
        currentY = drawSpec(3, 'Chassis Number', data.inv_chassis || '', currentY, true);
        currentY = drawSpec(4, 'Engine Number', data.in_engine || '', currentY, true);
        currentY = drawSpec(5, 'Horse Power', data.hp || '14.49 PS @ 9250 rpm', currentY);
        currentY = drawSpec(6, 'Cubic Capacity', data.cc || '124.71', currentY);
        currentY = drawSpec(7, 'Fuel Used', data.fuel || 'PETROL', currentY);
        currentY = drawSpec(8, 'No.of Cylinderes', data.no_of_cylider || '1', currentY);
        currentY = drawSpec(9, 'Seating Capacity( incl Driver)', data.seat_capacity || '1+1', currentY);
        currentY = drawSpec(10, 'Unladen Weight (Dry Weight)', data.ul_weight ? `${data.ul_weight}` : ' ', currentY);
        currentY = drawSpec(11, 'Color/Colours of the Body', data.inv_color || '', currentY);
        currentY = drawSpec(12, 'Gross Vehicle Weight', data.r_weight ? `${data.r_weight}` : ' ', currentY);
        currentY = drawSpec(13, 'Type of Body', data.tbody || 'Solo with Pillion', currentY);
        currentY = drawSpec(14, 'Manufacturing Date', data.p_date ? new Date(data.p_date).toLocaleDateString('en-GB') : '', currentY);

        currentY += 40;
        doc.font('Times-Roman').fontSize(7.5);
        doc.text('Sign of Customer Or His Agent', 40, currentY);
        doc.font('Times-Bold').text('SARATHY MOTORS', 450, currentY, { width: 120, align: 'center' });
        doc.text('Authorised Signatory', 450, currentY + 12, { width: 120, align: 'center' });

        doc.moveTo(40, currentY + 35).lineTo(550, currentY + 35).dash(2, { space: 2 }).stroke().undash();

        const totalPages = doc.bufferedPageRange().count;
        for (let i = 0; i < totalPages; i++) {
            doc.switchToPage(i);
            const now = new Date();
            const printedText = `Printed On: ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}`;
            const pageText = `Page ${i + 1}/${totalPages}`;

            doc.font('Times-Roman').fontSize(7.5)
                .text(printedText, 40, 810, { lineBreak: false });
            doc.text(pageText, 500, 810, { lineBreak: false });
        }

        doc.end();
    } catch (err) {
        console.error('Sales Letter PDF Error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate Sales Letter PDF' });
    }
};

const createStickerPdf = async (req, res) => {
    try {
        const [records] = await db.execute(
            `SELECT * FROM tbl_invoice_labour WHERE inv_id = ?`, [req.params.id]
        );

        if (!records.length) return res.status(404).json({ success: false, message: 'Invoice not found' });
        const data = records[0];

        const doc = new PDFDocument({ margin: 20, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Stickers_${data.inv_no}.pdf"`);
        doc.pipe(res);

        const stickerWidth = 180;
        const stickerHeight = 100;
        const gapX = 10;
        const gapY = 20;

        for (let i = 0; i < 6; i++) {
            let row = Math.floor(i / 3);
            let col = i % 3;
            let x = 30 + col * (stickerWidth + gapX);
            let y = 30 + row * (stickerHeight + gapY);

            let stickerY = y;
            doc.font('Times-Bold').fontSize(8.5).text(data.inv_cus || '', x, stickerY, { width: stickerWidth });
            stickerY += 12;

            doc.font('Times-Roman').fontSize(7.5).text(data.inv_cus_addres.replace(/\r?\n|\r/g, ' ') || '', x, stickerY, { width: stickerWidth });
            const addrH = doc.heightOfString(data.inv_cus_addres || '', { width: stickerWidth, size: 7.5 });
            stickerY += Math.max(15, addrH + 2);

            doc.text(`Chassis No:- ${data.inv_chassis || ''}`, x, stickerY, { width: stickerWidth });
            stickerY += 12;
            doc.text(`Engine No:- ${data.in_engine || ''}`, x, stickerY, { width: stickerWidth });
            stickerY += 12;
            doc.text(`Inv& Date:- ${data.inv_no} & ${data.inv_inv_date ? new Date(data.inv_inv_date).toLocaleDateString('en-GB') : ''}`, x, stickerY, { width: stickerWidth });
        }

        doc.end();
    } catch (err) {
        console.error('Sticker PDF Error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate Sticker PDF' });
    }
};

const createRtoBillPdf = async (req, res) => {
    // RTO Bill is just createSalesPdf but with "SARATHY MOTORS" instead of "SARATHY BIKES PVT LTD"
    // To keep it clean, I'll essentially reuse createSalesPdf logic but change the title string.
    try {
        const [records] = await db.execute(
            `SELECT inv.*, b.branch_name, b.branch_address, b.branch_ph, b.branch_gstin 
             FROM tbl_invoice_labour inv
             LEFT JOIN tbl_branch b ON b.b_id = inv.inv_branch
             WHERE inv.inv_id = ?`, [req.params.id]
        );

        if (!records.length) return res.status(404).json({ success: false, message: 'Invoice not found' });
        const data = records[0];

        const items = [{
            model: data.inv_vehicle_code || '',
            desc: data.inv_vehicle || '',
            hsn: data.inv_hsncode || '',
            rate: parseFloat(data.inv_basic_amt || 0),
            disc: parseFloat(data.inv_discount_amt || 0),
            taxable: parseFloat(data.inv_taxable_amt || 0),
            sgst: parseFloat(data.inv_sgst || 0),
            cgst: parseFloat(data.inv_cgst || 0),
            cess: parseFloat(data.inv_cess || 0),
            amount: parseFloat(data.inv_total || 0)
        }];

        const doc = new PDFDocument({ margin: 30, size: 'A4', bufferPages: true });
        let filename = `Sales_${data.inv_no}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        doc.pipe(res);

        const col = {
            sl: 40, model: 75, desc: 130, rate: 210, qty: 260, disc: 290, taxable: 340, sgst: 390, cgst: 460, cess: 510, amt: 535, end: 575
        };

        const drawHeaders = (isFirstPage) => {
            if (isFirstPage) {
                // --- Header Section ---
                // doc.font('Times-Bold').fontSize(7.5).text('Branch Address:', 40, 30);
                // doc.font('Times-Bold').fontSize(8.5).text(data.branch_name || '', 40, 42);

                // const branchAddr = data.branch_address ? data.branch_address.replace(/\r/g, '') : '';
                // const branchAddrH = doc.heightOfString(branchAddr, { width: 220, size: 7 });
                // doc.font('Times-Roman').fontSize(7).text(branchAddr, 40, 54, { width: 220, lineGap: -1 });

                // let currentY = 54 + branchAddrH + 2;
                // doc.text(`PH : ${data.branch_ph || ''}`, 40, currentY);
                // currentY += 10;

                doc.font('Times-Bold').fontSize(10).text('SARATHY MOTORS', 240, 30, { width: 200, align: 'center' });
                doc.font('Times-Roman').fontSize(7.5).text('Sarathy Bajaj Pallimukku Kollam Kerala State\nCode: 32 Kerala [State Code :32]', 240, 42, { width: 200, align: 'center' });

                doc.fontSize(25).font('Times-Bold').text('KTM', 450, 30, { width: 125, align: 'right' });

                doc.font('Times-Bold').fontSize(7.5).text(`GSTIN:`, 40, 105);
                doc.font('Times-Bold').fontSize(9).text(data.branch_gstin || '32ABECS8915L1Z0', 40, 116);

                doc.fontSize(16).text('TAX INVOICE', 240, 105, { width: 200, align: 'center' });

                doc.moveTo(40, 130).lineTo(575, 130).lineWidth(1).stroke();

                // --- Details Section ---
                let detailY = 140;
                const fieldX1 = 40, fieldX2 = 120, fieldX3 = 390, fieldX4 = 475;
                doc.font('Times-Bold').fontSize(7.5);

                const drawFieldRow = (label1, val1, label2, val2, y, bold1 = false, bold2 = false) => {
                    doc.font('Times-Bold').text(label1, fieldX1, y);
                    doc.text(':', fieldX2 - 10, y);
                    doc.font(bold1 ? 'Times-Bold' : 'Times-Roman').text(val1 || '', fieldX2, y, { width: 250 });

                    doc.font('Times-Bold').text(label2, fieldX3, y);
                    doc.text(':', fieldX4 - 10, y);
                    doc.font(bold2 ? 'Times-Bold' : 'Times-Roman').text(val2 || '', fieldX4, y, { width: 100 });
                };

                drawFieldRow('Invoice No.', data.inv_no, 'CDMS No', data.inv_cdms_no || '', detailY, true, false);
                detailY += 12;
                drawFieldRow('Invoice Date', data.inv_inv_date ? new Date(data.inv_inv_date).toLocaleDateString('en-GB') : '', 'Receipt No.', data.inv_receipt_no || '', detailY);
                detailY += 12;

                doc.font('Times-Bold').text('Billed TO', fieldX1, detailY);
                doc.text(':', fieldX2 - 10, detailY);
                doc.font('Times-Bold').text(data.inv_cus || '', fieldX2, detailY);

                doc.font('Times-Bold').text('Registration', fieldX3, detailY);
                doc.text(':', fieldX4 - 10, detailY);
                doc.font('Times-Roman').text(data.inv_regn || 'KOLLAM', fieldX4, detailY);

                detailY += 12;
                doc.font('Times-Roman').text(`Mobile : ${data.inv_pho || ''}`, fieldX2, detailY);
                doc.font('Times-Bold').text('Sale Date', fieldX3, detailY);
                doc.text(':', fieldX4 - 10, detailY);
                doc.font('Times-Roman').text(data.inv_inv_date ? new Date(data.inv_inv_date).toLocaleDateString('en-GB') : '', fieldX4, detailY);

                detailY += 12;
                const billedAddr = `${data.inv_cus_addres || ''}\n${data.inv_place || ''} ${data.inv_pincode || ''}\nPincode : ${data.inv_pincode || ''}\nKerala[State Code :32] INDIA`;
                const billedAddrH = doc.heightOfString(billedAddr, { width: 250, size: 7.5 });
                doc.font('Times-Roman').text(billedAddr, fieldX2, detailY, { width: 250 });

                // Right side fields continue while address is drawing
                doc.font('Times-Bold').text('Hypothecation', fieldX3, detailY);
                doc.text(':', fieldX4 - 10, detailY);
                doc.font('Times-Bold').text(data.inv_hypothication || 'BAJAJ FINANCE LTD', fieldX4, detailY, { width: 100 });

                const hypH = doc.heightOfString(data.inv_hypothication || 'BAJAJ FINANCE LTD', { width: 100, size: 7.5 });
                let rightY = detailY + Math.max(12, hypH);

                doc.font('Times-Bold').text('Fin Dues', fieldX3, rightY);
                doc.text(':', fieldX4 - 10, rightY);
                doc.font('Times-Roman').text(data.inv_finance_dues || '', fieldX4, rightY);
                rightY += 12;

                doc.font('Times-Bold').text('Chassis No.', fieldX3, rightY);
                doc.text(':', fieldX4 - 10, rightY);
                doc.font('Times-Bold').text(data.inv_chassis || '', fieldX4, rightY);
                rightY += 12;

                detailY = Math.max(detailY + billedAddrH + 4, rightY);

                drawFieldRow('Father/Husband', data.inv_cus_father_hus || '', 'Engine No.', data.in_engine || '', detailY, false, true);
                detailY += 12;
                drawFieldRow('Mobile No.', data.inv_pho || '', 'Color', data.inv_color || '', detailY);
                detailY += 12;
                drawFieldRow('Executive Name', data.inv_advisername || '', '', '', detailY, true);
                detailY += 12;
                drawFieldRow('Invoice Type', data.inv_type || '01', '', '', detailY);
                detailY += 12;
                drawFieldRow('Customer GSTIN', data.inv_gstin || '', '', '', detailY);

                detailY += 18;
                doc.moveTo(40, detailY).lineTo(575, detailY).lineWidth(1).stroke();
                return detailY + 10;
            } else {
                return 40;
            }
        };

        const drawTableLines = (y, height) => {
            doc.rect(col.sl, y, col.end - col.sl, height).lineWidth(0.5).stroke();
            doc.moveTo(col.model, y).lineTo(col.model, y + height).stroke();
            doc.moveTo(col.desc, y).lineTo(col.desc, y + height).stroke();
            doc.moveTo(col.rate, y).lineTo(col.rate, y + height).stroke();
            doc.moveTo(col.qty, y).lineTo(col.qty, y + height).stroke();
            doc.moveTo(col.disc, y).lineTo(col.disc, y + height).stroke();
            doc.moveTo(col.taxable, y).lineTo(col.taxable, y + height).stroke();
            doc.moveTo(col.sgst, y).lineTo(col.sgst, y + height).stroke();
            doc.moveTo(col.cgst, y).lineTo(col.cgst, y + height).stroke();
            doc.moveTo(col.cess, y).lineTo(col.cess, y + height).stroke();
            doc.moveTo(col.amt, y).lineTo(col.amt, y + height).stroke();
        };

        const drawTableHeader = (y) => {
            doc.font('Times-Bold').fontSize(7);
            const h = 30;
            doc.rect(col.sl, y, col.end - col.sl, h).lineWidth(1).stroke();

            doc.text('SL.No.', col.sl + 2, y + 10);
            doc.text('Model', col.model + 2, y + 10);
            doc.text('DESCRIPTION', col.desc + 2, y + 10);
            doc.text('RATE', col.rate + 2, y + 10);
            doc.text('QTY', col.qty + 2, y + 10);
            doc.text('DISC', col.disc + 2, y + 10);
            doc.text('TAXABLE\nAMOUNT', col.taxable + 2, y + 5);
            doc.text('SGST/\nUTGST', col.sgst + 2, y + 5);
            doc.text('CGST', col.cgst + 2, y + 10);
            doc.text('CESS', col.cess + 2, y + 10);
            doc.text('AMOUNT', col.amt + 2, y + 10);

            doc.moveTo(col.model, y).lineTo(col.model, y + h).stroke();
            doc.moveTo(col.desc, y).lineTo(col.desc, y + h).stroke();
            doc.moveTo(col.rate, y).lineTo(col.rate, y + h).stroke();
            doc.moveTo(col.qty, y).lineTo(col.qty, y + h).stroke();
            doc.moveTo(col.disc, y).lineTo(col.disc, y + h).stroke();
            doc.moveTo(col.taxable, y).lineTo(col.taxable, y + h).stroke();
            doc.moveTo(col.sgst, y).lineTo(col.sgst, y + h).stroke();
            doc.moveTo(col.cgst, y).lineTo(col.cgst, y + h).stroke();
            doc.moveTo(col.cess, y).lineTo(col.cess, y + h).stroke();
            doc.moveTo(col.amt, y).lineTo(col.amt, y + h).stroke();
            return y + h;
        };

        let currentY = drawHeaders(true);
        currentY = drawTableHeader(currentY);

        doc.font('Times-Roman').fontSize(7.5);
        items.forEach((item, idx) => {
            const desc = (item.desc || '') + (item.hsn ? ` / ${item.hsn}` : '');
            const descH = doc.heightOfString(desc, { width: col.rate - col.desc - 4, size: 7.5 });
            let rowH = Math.max(25, descH + 10);

            if (currentY + rowH > 750) {
                doc.addPage();
                currentY = drawTableHeader(40);
                doc.font('Times-Roman').fontSize(7.5);
            }
            drawTableLines(currentY, rowH);
            doc.text(idx + 1, col.sl + 5, currentY + 7);
            doc.text(item.model || '', col.model + 2, currentY + 7);
            doc.text(desc, col.desc + 2, currentY + 7, { width: col.rate - col.desc - 4 });
            doc.text(item.rate.toFixed(0), col.rate, currentY + 7, { width: col.qty - col.rate - 2, align: 'right' });
            doc.text('1', col.qty, currentY + 7, { width: col.disc - col.qty - 2, align: 'right' });
            doc.text(item.disc.toFixed(2), col.disc, currentY + 7, { width: col.taxable - col.disc - 2, align: 'right' });
            doc.text(item.taxable.toFixed(0), col.taxable, currentY + 7, { width: col.sgst - col.taxable - 2, align: 'right' });
            doc.text(item.sgst.toFixed(2), col.sgst, currentY + 7, { width: col.cgst - col.sgst - 2, align: 'right' });
            doc.text(item.cgst.toFixed(2), col.cgst, currentY + 7, { width: col.cess - col.cgst - 2, align: 'right' });
            doc.text(item.cess.toFixed(0), col.cess, currentY + 7, { width: col.amt - col.cess - 2, align: 'right' });
            doc.text(item.amount.toFixed(2), col.amt, currentY + 7, { width: col.end - col.amt - 2, align: 'right' });
            currentY += rowH;
        });

        // --- Totals Section ---
        if (currentY + 120 > 750) {
            doc.addPage();
            currentY = 40;
        }

        doc.font('Times-Bold').fontSize(7.5);
        doc.rect(col.sl, currentY, col.end - col.sl, 12).lineWidth(1).stroke();
        doc.text('TOTAL', col.qty, currentY + 3);

        let totalDisc = items.reduce((a, b) => a + b.disc, 0);
        let totalTaxable = items.reduce((a, b) => a + b.taxable, 0);
        let totalSGST = items.reduce((a, b) => a + b.sgst, 0);
        let totalCGST = items.reduce((a, b) => a + b.cgst, 0);
        let totalCess = items.reduce((a, b) => a + b.cess, 0);
        let totalAmount = items.reduce((a, b) => a + b.amount, 0);

        doc.text(totalDisc.toFixed(2), col.disc, currentY + 3, { width: col.taxable - col.disc - 2, align: 'right' });
        doc.text(totalTaxable.toFixed(0), col.taxable, currentY + 3, { width: col.sgst - col.taxable - 2, align: 'right' });
        doc.text(totalSGST.toFixed(2), col.sgst, currentY + 3, { width: col.cgst - col.sgst - 2, align: 'right' });
        doc.text(totalCGST.toFixed(2), col.cgst, currentY + 3, { width: col.cess - col.cgst - 2, align: 'right' });
        doc.text(totalCess.toFixed(0), col.cess, currentY + 3, { width: col.amt - col.cess - 2, align: 'right' });
        doc.text(totalAmount.toFixed(2), col.amt, currentY + 3, { width: col.end - col.amt - 2, align: 'right' });

        doc.moveTo(col.disc, currentY).lineTo(col.disc, currentY + 12).stroke();
        doc.moveTo(col.taxable, currentY).lineTo(col.taxable, currentY + 12).stroke();
        doc.moveTo(col.sgst, currentY).lineTo(col.sgst, currentY + 12).stroke();
        doc.moveTo(col.cgst, currentY).lineTo(col.cgst, currentY + 12).stroke();
        doc.moveTo(col.cess, currentY).lineTo(col.cess, currentY + 12).stroke();
        doc.moveTo(col.amt, currentY).lineTo(col.amt, currentY + 12).stroke();

        currentY += 12;
        const subtotal = totalAmount;
        const roundedGrandTotal = Math.round(subtotal);
        const roundOff = (roundedGrandTotal - subtotal).toFixed(2);

        const drawSummaryRow = (label, value, y) => {
            doc.rect(col.taxable, y, col.amt - col.taxable, 12).lineWidth(0.5).stroke();
            doc.rect(col.amt, y, col.end - col.amt, 12).lineWidth(0.5).stroke();
            doc.font('Times-Bold').text(label, col.taxable + 2, y + 3);
            doc.font('Times-Roman').text(parseFloat(value || 0).toFixed(2), col.amt, y + 3, { width: col.end - col.amt - 2, align: 'right' });
        };

        drawSummaryRow('Round Off', roundOff, currentY);
        currentY += 12;
        doc.rect(col.taxable, currentY, col.amt - col.taxable, 12).lineWidth(1).stroke();
        doc.rect(col.amt, currentY, col.end - col.amt, 12).lineWidth(1).stroke();
        doc.font('Times-Bold').text('Total Amount', col.taxable + 2, currentY + 3);
        doc.text(parseFloat(roundedGrandTotal).toFixed(2), col.amt, currentY + 3, { width: col.end - col.amt - 2, align: 'right' });

        currentY += 15;
        // Amount in words
        const leftWidth = 130;
        const rightWidth = col.end - col.sl - leftWidth;
        doc.rect(col.sl, currentY, leftWidth, 25).lineWidth(1).stroke();
        doc.rect(col.sl + leftWidth, currentY, rightWidth, 25).lineWidth(1).stroke();
        doc.font('Times-Bold').fontSize(9).text('AMOUNT IN WORDS', col.sl + 5, currentY + 8);
        doc.font('Times-Bold').fontSize(9.5).text(`RS: ${numberToWords(roundedGrandTotal)}`, col.sl + leftWidth + 5, currentY + 8, { width: rightWidth - 10 });

        currentY += 30;
        doc.font('Times-Bold').fontSize(8.5).text('Tax amount payable on reverse charges (in Rs.) : Nil', col.sl, currentY);

        currentY += 60;
        doc.font('Times-Roman').text('Sign of Customer Or His Agent', col.sl, currentY);
        doc.font('Times-Bold').text('SARATHY BIKES PVT LTD', col.end - 150, currentY, { width: 150, align: 'center' });
        doc.font('Times-Bold').fontSize(8.5).text('Authorised Signatory', col.end - 150, currentY + 12, { width: 150, align: 'center' });

        doc.moveTo(col.sl, currentY + 35).lineTo(col.end, currentY + 35).dash(2, { space: 2 }).stroke().undash();

        // Footer & Page numbers
        const totalPages = doc.bufferedPageRange().count;
        for (let i = 0; i < totalPages; i++) {
            doc.switchToPage(i);
            const now = new Date();
            const printedText = `Printed On: ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}`;
            const pageText = `Page ${i + 1}/${totalPages}`;

            // Draw at Y=810 (safe within margin) with lineBreak: false to stay on page
            doc.font('Times-Roman').fontSize(7.5)
                .text(printedText, col.sl, 810, { lineBreak: false });
            doc.text(pageText, col.end - 50, 810, { lineBreak: false });
        }

        doc.end();

    } catch (err) {
        console.error('Sales PDF Error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate Sales PDF' });
    }
}

const saveInvoice = async (req, res) => {
    const {
        invoiceNo, branchId, invoiceDate, customerName, chassisNo, engineNo,
        regNo, adviserId, totalAmount, mobileNo, guardian, address,
        issueType, age, cdmsNo, area, hypothication, place, receiptNo,
        financeDues, vehicle, pCode, color, gstin, basicAmount,
        discountAmount, hsnCode, taxableAmount, sgst, cgst, cess, pincode
    } = req.body;

    if (!invoiceNo) return res.status(400).json({ success: false, message: 'Invoice number required' });
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const insertSql = `
            INSERT INTO tbl_invoice_labour (
                inv_no, inv_branch, inv_inv_date, inv_cus, inv_chassis, in_engine, 
                inv_regn, inv_advisername, inv_total, inv_pho, inv_cus_father_hus, 
                inv_cus_addres, inv_type, inv_age, inv_cdms_no, inv_area, inv_hypothication, inv_place, 
                inv_receipt_no, inv_finance_dues, inv_vehicle, inv_vehicle_code, inv_color, inv_gstin, 
                inv_basic_amt, inv_discount_amt, inv_hsncode, inv_taxable_amt, inv_sgst, inv_cgst, inv_cess, 
                inv_pincode, status, inv_color_code
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, '')
        `;

        const parsedDate = invoiceDate ? new Date(invoiceDate) : new Date();

        const params = [
            invoiceNo, branchId, parsedDate, customerName, chassisNo || '', engineNo || '',
            regNo || '', adviserId || '', totalAmount, mobileNo || '', guardian || '',
            address || '', issueType || '', age || '', cdmsNo || '', area || '', hypothication || '', place || '',
            receiptNo || '', financeDues || '', vehicle || '', pCode || '', color || '', gstin || '',
            basicAmount || 0, discountAmount || 0, hsnCode || '', taxableAmount || 0, sgst || 0, cgst || 0, cess || 0,
            pincode || ''
        ];

        const [result] = await conn.execute(insertSql, params);

        await conn.commit();
        res.json({ success: true, message: 'Sales invoice saved successfully', inv_id: result.insertId });
    } catch (err) {
        await conn.rollback();
        console.error('Failed to save sales invoice:', err);
        res.status(500).json({ success: false, message: 'Failed to save sales invoice' });
    } finally {
        conn.release();
    }
};

const updateInvoice = async (req, res) => {
    const { id } = req.params;
    const {
        invoiceNo, branchId, invoiceDate, customerName, chassisNo, engineNo,
        regNo, adviserId, totalAmount, mobileNo, guardian, address,
        issueType, age, cdmsNo, area, hypothication, place, receiptNo,
        financeDues, vehicle, pCode, color, gstin, basicAmount,
        discountAmount, hsnCode, taxableAmount, sgst, cgst, cess, pincode
    } = req.body;

    if (!id || !invoiceNo) return res.status(400).json({ success: false, message: 'Invoice ID and number required' });
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const updateSql = `
            UPDATE tbl_invoice_labour SET
                inv_no=?, inv_branch=?, inv_inv_date=?, inv_cus=?, inv_chassis=?, in_engine=?, 
                inv_regn=?, inv_advisername=?, inv_total=?, inv_pho=?, inv_cus_father_hus=?, 
                inv_cus_addres=?, inv_type=?, inv_age=?, inv_cdms_no=?, inv_area=?, inv_hypothication=?, inv_place=?, 
                inv_receipt_no=?, inv_finance_dues=?, inv_vehicle=?, inv_vehicle_code=?, inv_color=?, inv_gstin=?, 
                inv_basic_amt=?, inv_discount_amt=?, inv_hsncode=?, inv_taxable_amt=?, inv_sgst=?, inv_cgst=?, inv_cess=?, 
                inv_pincode=?, inv_color_code=''
            WHERE inv_id=?
        `;

        const parsedDate = invoiceDate ? new Date(invoiceDate) : new Date();

        const params = [
            invoiceNo, branchId, parsedDate, customerName, chassisNo || '', engineNo || '',
            regNo || '', adviserId || '', totalAmount, mobileNo || '', guardian || '',
            address || '', issueType || '', age || '', cdmsNo || '', area || '', hypothication || '', place || '',
            receiptNo || '', financeDues || '', vehicle || '', pCode || '', color || '', gstin || '',
            basicAmount || 0, discountAmount || 0, hsnCode || '', taxableAmount || 0, sgst || 0, cgst || 0, cess || 0,
            pincode || '', id
        ];

        await conn.execute(updateSql, params);

        await conn.commit();
        res.json({ success: true, message: 'Sales invoice updated successfully', inv_id: id });
    } catch (err) {
        await conn.rollback();
        console.error('Failed to update sales invoice:', err);
        res.status(500).json({ success: false, message: 'Failed to update sales invoice' });
    } finally {
        conn.release();
    }
};

const getSalesExecutives = async (req, res) => {
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

module.exports = {
    getNextInvoiceNo,
    getAllLabourCodes,
    getLabourDetails,
    getHypothecationOptions,
    getChassisRecords,
    listInvoices,
    createSalesPdf,
    createSalesLetterPdf,
    createStickerPdf,
    createRtoBillPdf,
    getSalesExecutives,
    saveInvoice,
    updateInvoice
};
