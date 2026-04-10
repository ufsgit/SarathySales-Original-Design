const db = require('../config/db');
const { updateStockQuantity } = require('../utils/stockUtils');
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

/**
 * Generate Sales Return PDF
 */
const createSalesReturnPdf = async (req, res) => {
    try {
        const [records] = await db.execute(
            `SELECT sr.*, b.branch_name, b.branch_address, b.branch_ph, b.branch_gstin 
             FROM tbl_sale_return sr
             LEFT JOIN tbl_branch b ON b.b_id = sr.inv_branch
             WHERE sr.inv_id = ?`, [req.params.id]
        );

        if (!records.length) return res.status(404).json({ success: false, message: 'Sales Return record not found' });
        const data = records[0];

        const doc = new PDFDocument({ margin: 30, size: 'A4', bufferPages: true });
        let filename = `SalesReturn_${data.inv_no}.pdf`;
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
                doc.font('Times-Bold').fontSize(8.5).text(data.branch_name || 'SARATHY MOTORS', 40, 42);

                const branchAddr = data.branch_address ? data.branch_address.replace(/\r/g, '') : 'Sarathy Bajaj Pallimukku Kollam Kerala State\nCode: 32 Kerala [Code: 32]';
                doc.font('Times-Roman').fontSize(7).text(branchAddr, 40, 54, { width: 220, lineGap: -1 });

                let currentY = 54 + doc.heightOfString(branchAddr, { width: 220, size: 7 }) + 2;
                doc.text(`PH : ${data.branch_ph || ''}`, 40, currentY);

                // Main Title Center
                doc.font('Times-Bold').fontSize(10).text('SARATHY MOTORS', 240, 30, { width: 200, align: 'center' });
                
                const centerAddrHeight = doc.heightOfString(branchAddr, { width: 200, size: 7.5 });
                doc.font('Times-Roman').fontSize(7.5).text(branchAddr, 240, 42, { width: 200, align: 'center' });
                
                let gstinY = 42 + centerAddrHeight + 2;
                doc.text(`GSTIN: ${data.branch_gstin || ''}`, 240, gstinY, { width: 200, align: 'center' });

                doc.fontSize(25).font('Times-Bold').text('SALES RETURN', 430, 30, { width: 145, align: 'right' });

                let taxInvoiceY = Math.max(95, gstinY + 15);
                doc.fontSize(16).text('TAX INVOICE', 240, taxInvoiceY, { width: 200, align: 'center' });

                doc.moveTo(40, 125).lineTo(col.end, 125).lineWidth(1).stroke();

                // --- Details Section ---
                let detailY = 135;
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
                const billedAddr = `${data.inv_cus_addres || ''}\n${data.inv_place || ''} ${data.inv_pincode || ''}`;
                doc.font('Times-Roman').text(billedAddr, fieldX2, detailY, { width: 250 });

                doc.font('Times-Bold').text('Hypothication', fieldX3, detailY);
                doc.text(':', fieldX4 - 10, detailY);
                doc.font('Times-Bold').text(data.inv_hypothication || '', fieldX4, detailY, { width: 100 });

                const addrHeight = doc.heightOfString(billedAddr, { width: 250, size: 7.5 });
                const hypH = doc.heightOfString(data.inv_hypothication || '', { width: 100, size: 7.5 });
                
                let currentRightY = detailY + Math.max(12, hypH + 2);
                let currentLeftY = detailY + addrHeight + 2;

                doc.font('Times-Roman').text(`Pincode : ${data.inv_pincode || ''}`, fieldX2, currentLeftY);
                doc.text('Kerala[State Code :32] INDIA', fieldX2, currentLeftY + 10);
                currentLeftY += 22; // Move past pincode and state lines

                doc.font('Times-Bold').text('Fin Dues', fieldX3, currentRightY);
                doc.text(':', fieldX4 - 10, currentRightY);
                doc.font('Times-Roman').text(data.inv_finance_dues || '', fieldX4, currentRightY);
                currentRightY += 12;

                currentLeftY += 25;

                const drawLeftField = (label, val, y, isBold = false) => {
                    doc.font('Times-Bold').text(label, fieldX1, y);
                    doc.text(':', fieldX2 - 10, y);
                    doc.font(isBold ? 'Times-Bold' : 'Times-Roman').text(val || '', fieldX2, y, { width: 250 });
                };

                drawLeftField('Father/Husband', data.inv_cus_father_hus || '', currentLeftY);
                doc.font('Times-Bold').text('Chassis No.', fieldX3, currentRightY);
                doc.text(':', fieldX4 - 10, currentRightY);
                doc.font('Times-Bold').text(data.inv_chassis || '', fieldX4, currentRightY);
                currentRightY += 12;
                currentLeftY += 12;

                drawLeftField('Mobile No.', data.inv_pho || '', currentLeftY);
                doc.font('Times-Bold').text('Engine No.', fieldX3, currentRightY);
                doc.text(':', fieldX4 - 10, currentRightY);
                doc.font('Times-Bold').text(data.in_engine || '', fieldX4, currentRightY);
                currentRightY += 12;
                currentLeftY += 12;

                drawLeftField('Executive Name', data.inv_advisername || '', currentLeftY, true);
                doc.font('Times-Bold').text('Color', fieldX3, currentRightY);
                doc.text(':', fieldX4 - 10, currentRightY);
                doc.font('Times-Roman').text(data.inv_color || '', fieldX4, currentRightY);
                currentRightY += 12;
                currentLeftY += 12;

                drawLeftField('Invoice Type', data.inv_type || '01', currentLeftY);
                currentLeftY += 12;

                drawLeftField('Customer GSTIN', data.inv_gstin || '', currentLeftY);
                currentLeftY += 15;

                // Final detail section Y is the deepest point reached by either left or right columns
                detailY = Math.max(currentLeftY, currentRightY);

                doc.font('Times-Bold').text('Return Date', fieldX3, detailY);
                doc.text(':', fieldX4 - 10, detailY);
                doc.font('Times-Roman').text(data.return_date ? new Date(data.return_date).toLocaleDateString('en-GB') : '', fieldX4, detailY);
                detailY += 12;

                detailY += 12;

                detailY += 18;
                doc.moveTo(40, detailY).lineTo(col.end, detailY).lineWidth(1).stroke();
                return detailY + 10;
            } else {
                return 40;
            }
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
        const item = {
            model: data.inv_vehicle_code || '',
            desc: data.inv_vehicle || '',
            rate: parseFloat(data.inv_basic_amt || 0),
            qty: 1,
            disc: parseFloat(data.inv_discount_amt || 0),
            taxable: parseFloat(data.inv_taxable_amt || 0),
            sgst: parseFloat(data.inv_sgst || 0),
            cgst: parseFloat(data.inv_cgst || 0),
            cess: parseFloat(data.inv_cess || 0),
            amount: parseFloat(data.inv_total || 0)
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

        let rowH = 25;
        drawTableLines(currentY, rowH);
        doc.text('1', col.sl + 5, currentY + 7);
        doc.text(item.model, col.model + 2, currentY + 7);
        doc.text(item.desc, col.desc + 2, currentY + 7, { width: col.rate - col.desc - 4 });
        doc.text(item.rate.toFixed(2), col.rate, currentY + 7, { width: col.qty - col.rate - 2, align: 'right' });
        doc.text('1', col.qty, currentY + 7, { width: col.disc - col.qty - 2, align: 'right' });
        doc.text(item.disc.toFixed(2), col.disc, currentY + 7, { width: col.taxable - col.disc - 2, align: 'right' });
        doc.text(item.taxable.toFixed(2), col.taxable, currentY + 7, { width: col.sgst - col.taxable - 2, align: 'right' });
        doc.text(item.sgst.toFixed(2), col.sgst, currentY + 7, { width: col.cgst - col.sgst - 2, align: 'right' });
        doc.text(item.cgst.toFixed(2), col.cgst, currentY + 7, { width: col.cess - col.cgst - 2, align: 'right' });
        doc.text(item.cess.toFixed(2), col.cess, currentY + 7, { width: col.amt - col.cess - 2, align: 'right' });
        doc.text(item.amount.toFixed(2), col.amt, currentY + 7, { width: col.end - col.amt - 2, align: 'right' });
        currentY += rowH;

        // Totals
        doc.font('Times-Bold').fontSize(7.5);
        doc.rect(col.sl, currentY, col.end - col.sl, 12).lineWidth(1).stroke();
        doc.text('TOTAL', col.qty, currentY + 3);
        doc.text(item.disc.toFixed(2), col.disc, currentY + 3, { width: col.taxable - col.disc - 2, align: 'right' });
        doc.text(item.taxable.toFixed(2), col.taxable, currentY + 3, { width: col.sgst - col.taxable - 2, align: 'right' });
        doc.text(item.sgst.toFixed(2), col.sgst, currentY + 3, { width: col.cgst - col.sgst - 2, align: 'right' });
        doc.text(item.cgst.toFixed(2), col.cgst, currentY + 3, { width: col.cess - col.cgst - 2, align: 'right' });
        doc.text(item.cess.toFixed(2), col.cess, currentY + 3, { width: col.amt - col.cess - 2, align: 'right' });
        doc.text(item.amount.toFixed(2), col.amt, currentY + 3, { width: col.end - col.amt - 2, align: 'right' });

        currentY += 12;
        const subtotal = item.amount;
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
        doc.font('Times-Bold').text('SARATHY MOTORS', col.end - 150, currentY, { width: 150, align: 'center' });
        doc.text('Authorised Signatory', col.end - 150, currentY + 12, { width: 150, align: 'center' });

        doc.moveTo(col.sl, currentY + 35).lineTo(col.end, currentY + 35).dash(2, { space: 2 }).stroke().undash();

        const totalPages = doc.bufferedPageRange().count;
        for (let i = 0; i < totalPages; i++) {
            doc.switchToPage(i);
            const now = new Date();
            const printedText = `Printed On: ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}`;
            const pageText = `Page ${i + 1}/${totalPages}`;
            doc.font('Times-Roman').fontSize(7.5).text(printedText, col.sl, 810, { lineBreak: false });
            doc.text(pageText, col.end - 50, 810, { lineBreak: false });
        }

        doc.end();
    } catch (err) {
        console.error('Sales Return PDF Error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate Sales Return PDF' });
    }
};

/**
 * Get Sales Return Report with pagination and search
 */
const getSalesReturnReport = async (req, res) => {
    try {
        let { branchId, page, limit, searchTerm } = req.query;

        // Default pagination
        page = Math.max(1, parseInt(page) || 1);
        limit = Math.max(1, parseInt(limit) || 10);
        const offset = (page - 1) * limit;

        let conditions = [];
        let params = [];

        // Branch filter - if branchId is provided (for admins)
        if (branchId && branchId !== 'All Branches') {
            conditions.push('sr.inv_branch = ?');
            params.push(branchId);
        }

        // Search filter
        if (searchTerm) {
            const term = `%${searchTerm}%`;
            conditions.push('(sr.inv_no LIKE ? OR sr.inv_cus LIKE ? OR sr.inv_chassis LIKE ? OR sr.inv_vehicle LIKE ?)');
            params.push(term, term, term, term);
        }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        // Query data
        const query = `
            SELECT 
                sr.*, 
                b.branch_name 
            FROM tbl_sale_return sr
            LEFT JOIN tbl_branch b ON b.b_id = sr.inv_branch
            ${where} 
            ORDER BY sr.inv_id DESC 
            LIMIT ${limit} OFFSET ${offset}
        `;

        const [rows] = await db.execute(query, params);

        // Query total count
        const countQuery = `SELECT COUNT(*) as total FROM tbl_sale_return sr ${where}`;
        const [countRows] = await db.execute(countQuery, params);
        const total = countRows[0].total;

        res.json({
            success: true,
            data: rows,
            total: total,
            page: page,
            limit: limit
        });
    } catch (err) {
        console.error('getSalesReturnReport error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sales return report',
            error: err.message
        });
    }
};

/**
 * Save Sales Return
 */
const saveSalesReturn = async (req, res) => {
    const { invNo, returnDate, returnReason } = req.body;

    if (!invNo) {
        return res.status(400).json({ success: false, message: 'Invoice number required' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Fetch original invoice details
        const [invoiceRows] = await conn.execute(
            `SELECT * FROM tbl_invoice_labour WHERE inv_no = ?`,
            [invNo]
        );

        if (invoiceRows.length === 0) {
            throw new Error('Invoice not found');
        }

        const inv = invoiceRows[0];

        // 2. Insert into tbl_sale_return
        const insertReturnSql = `
            INSERT INTO tbl_sale_return (
                inv_no, inv_cus, inv_cus_addres, inv_pho, inv_cus_father_hus,
                inv_inv_date, inv_type, inv_age, inv_cdms_no, inv_area,
                inv_hypothication, inv_chassis, in_engine, inv_place, inv_receipt_no,
                inv_regn, inv_advisername, inv_finance_dues, inv_branch, inv_vehicle,
                inv_vehicle_code, inv_color, inv_color_code, inv_total, inv_product_id,
                status, inv_gstin, inv_basic_amt, inv_discount_amt, inv_hsncode,
                inv_taxable_amt, inv_sgst, inv_cgst, inv_cess, return_date,
                inv_pincode
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const returnParams = [
            inv.inv_no, inv.inv_cus, inv.inv_cus_addres, inv.inv_pho, inv.inv_cus_father_hus,
            inv.inv_inv_date, inv.inv_type, inv.inv_age, inv.inv_cdms_no, inv.inv_area,
            inv.inv_hypothication, inv.inv_chassis, inv.in_engine, inv.inv_place, inv.inv_receipt_no,
            inv.inv_regn, inv.inv_advisername, inv.inv_finance_dues, inv.inv_branch, inv.inv_vehicle,
            inv.inv_vehicle_code, inv.inv_color, inv.inv_color_code, inv.inv_total, inv.inv_product_id,
            inv.status, inv.inv_gstin, inv.inv_basic_amt, inv.inv_discount_amt, inv.inv_hsncode,
            inv.inv_taxable_amt, inv.inv_sgst, inv.inv_cgst, inv.inv_cess, returnDate || new Date(),
            inv.inv_pincode
        ];

        await conn.execute(insertReturnSql, returnParams);

        // 3. Update purchaseitem status back to 'Available'
        if (inv.inv_chassis) {
            // 🔹 Find the EXACT purchaseitem record for this branch+chassis so we do NOT
            // affect other entries with the same chassis_no on different branches
            // or past entries of the same chassis_no on this branch.
            const [piRows] = await conn.execute(
                `SELECT pi.purchaseItemBillId
                 FROM purchaseitem pi
                 LEFT JOIN purchaseitembill pb ON pi.purchaseItemBillId = pb.purchaseItemBillId
                 WHERE pi.chassis_no = ?
                   AND pi.item_status = 'Delivered'
                   AND pb.purch_branchId = ?
                 LIMIT 1`,
                [inv.inv_chassis, inv.inv_branch]
            );

            if (piRows.length > 0) {
                const purchaseItemBillId = piRows[0].purchaseItemBillId;
                await conn.execute(
                    `UPDATE purchaseitem
                     SET item_status = 'Available', retn_status = 'Available'
                     WHERE chassis_no = ? AND purchaseItemBillId = ?`,
                    [inv.inv_chassis, purchaseItemBillId]
                );
            }

            // 4. Increment stock in tbl_stock
            // We need to fetch product info from the invoice
            // Note: inv_product_id was added in previous tasks, ensuring it's used.
            const productId = inv.inv_product_id;
            const branchId = inv.inv_branch;

            if (productId && branchId) {
                await updateStockQuantity(conn, productId, branchId, 1);
            }
        }

        // 5. Delete original invoice (as per PHP logic)
        await conn.execute(
            `DELETE FROM tbl_invoice_labour WHERE inv_id = ?`,
            [inv.inv_id]
        );

        await conn.commit();
        res.json({ success: true, message: 'Sales return processed successfully' });

    } catch (err) {
        await conn.rollback();
        console.error('saveSalesReturn error:', err);
        res.status(500).json({ success: false, message: 'Failed to process sales return: ' + err.message });
    } finally {
        conn.release();
    }
};

module.exports = {
    getSalesReturnReport,
    createSalesReturnPdf,
    saveSalesReturn
};
