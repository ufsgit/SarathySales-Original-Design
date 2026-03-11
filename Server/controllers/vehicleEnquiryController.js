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

const searchVehicles = async (req, res) => {
    let { query, branchId } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    try {
        const [rows] = await db.execute(
            `SELECT tbl_stock.*, tbl_branch.branch_name FROM tbl_stock
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_stock.stock_branch
             WHERE tbl_stock.stock_branch = ? AND tbl_stock.sold_status = 'N'
             AND (tbl_stock.stock_model LIKE ? OR tbl_stock.stock_chassis_no LIKE ? OR tbl_stock.stock_colour LIKE ?)`,
            [branchId, `%${query}%`, `%${query}%`, `%${query}%`]
        );
        res.json({ success: true, data: rows });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to search vehicles' }); }
};

const listModels = async (req, res) => {
    let branchId = req.query.branchId;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    try {
        const [rows] = await db.execute(
            `SELECT DISTINCT stock_model FROM tbl_stock WHERE stock_branch = ? AND sold_status = 'N' ORDER BY stock_model`, [branchId]);
        res.json({ success: true, data: rows.map(r => r.stock_model) });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to fetch models' }); }
};

const getVehicleByChassisNo = async (req, res) => {
    let { branchId } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    try {
        let query = `
            SELECT 
                til.*, 
                pb.invoiceNo as purchase_bill_no 
            FROM tbl_invoice_labour til
            LEFT JOIN purchaseitem pi ON pi.chassis_no = til.inv_chassis
            LEFT JOIN purchaseitembill pb ON pb.purchaseItemBillId = pi.purchaseItemBillId
            WHERE til.inv_chassis = ?`;

        const params = [req.params.chassisNo];
        if (branchId) {
            query += " AND til.inv_branch = ?";
            params.push(branchId);
        }
        query += " ORDER BY til.inv_id DESC LIMIT 1";

        const [rows] = await db.execute(query, params);

        //     SELECT 
        //     til.*, 
        //     pb.invoiceNo as purchase_bill_no 
        // FROM tbl_invoice_labour til
        // LEFT JOIN purchaseitem pi ON pi.chassis_no = til.inv_chassis
        // LEFT JOIN purchaseitembill pb ON pb.purchaseItemBillId = pi.purchaseItemBillId
        // WHERE til.inv_chassis = ? AND pb.purch_branchId = ?
        // ORDER BY til.inv_id DESC 
        // LIMIT 1`, [req.params.chassisNo, branchId]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Vehicle not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to fetch vehicle' }); }
};

const listChassis = async (req, res) => {
    let { branchId } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    try {
        let query = "SELECT DISTINCT inv_chassis FROM tbl_invoice_labour WHERE inv_chassis IS NOT NULL AND inv_chassis != ''";
        const params = [];
        if (branchId) {
            query += " AND inv_branch = ?";
            params.push(branchId);
        }
        query += " ORDER BY inv_chassis";
        const [rows] = await db.execute(query, params);
        res.json({ success: true, data: rows.map(r => r.inv_chassis) });
    } catch (err) {
        console.error('ERROR in listChassis:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch chassis list' });
    }
};

const createStickerPdf = async (req, res) => {
    try {
        const [records] = await db.execute(
            `SELECT * FROM tbl_invoice_labour 
             WHERE inv_chassis = ? ${req.user && req.user.role == 2 ? 'AND inv_branch = ?' : ''}
             ORDER BY inv_id DESC LIMIT 1`,
            req.user && req.user.role == 2 ? [req.params.chassisNo, req.user.branch_id] : [req.params.chassisNo]
        );

        if (!records.length) return res.status(404).json({ success: false, message: 'Vehicle not found' });
        const data = records[0];

        const doc = new PDFDocument({ margin: 20, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Stickers_${data.inv_chassis}.pdf"`);
        doc.pipe(res);

        const stickerWidth = 180;
        const stickerHeight = 100;
        const gapX = 10;
        const gapY = 20;

        for (let i = 0; i < 6; i++) {
            let rowIdx = Math.floor(i / 3);
            let colIdx = i % 3;
            let x = 30 + colIdx * (stickerWidth + gapX);
            let y = 30 + rowIdx * (stickerHeight + gapY);

            let stickerY = y;
            doc.font('Times-Bold').fontSize(8.5).text(data.inv_cus || '', x, stickerY, { width: stickerWidth });
            stickerY += 12;

            const addr = (data.inv_cus_addres || '').replace(/\r?\n|\r/g, ' ');
            doc.font('Times-Roman').fontSize(7.5).text(addr, x, stickerY, { width: stickerWidth });
            const addrH = doc.heightOfString(addr, { width: stickerWidth, size: 7.5 });
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

const createSaleLetterPdf = async (req, res) => {
    try {
        const [records] = await db.execute(
            `SELECT inv.*, lc.*, b.branch_name, b.branch_address, b.branch_ph, b.branch_gstin, pi.p_date
             FROM tbl_invoice_labour inv
             LEFT JOIN tbl_labour_code lc ON lc.labour_code = inv.inv_vehicle_code
             LEFT JOIN tbl_branch b ON b.b_id = inv.inv_branch
             LEFT JOIN purchaseitem pi ON pi.chassis_no = inv.inv_chassis
             WHERE inv.inv_chassis = ? ${req.user && req.user.role == 2 ? 'AND inv.inv_branch = ?' : ''}
             ORDER BY inv.inv_id DESC LIMIT 1`,
            req.user && req.user.role == 2 ? [req.params.chassisNo, req.user.branch_id] : [req.params.chassisNo]
        );

        if (!records.length) return res.status(404).json({ success: false, message: 'Vehicle details not found' });
        const data = records[0];

        const doc = new PDFDocument({ margin: 30, size: 'A4', bufferPages: true });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="SaleLetter_${data.inv_chassis}.pdf"`);
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
        drawField('Hypothication', data.inv_hypothication || 'NIL', currentY, true); currentY += 15;

        doc.font('Times-Bold').fontSize(9).text('The Details of vehicle are given below:-', 40, currentY);
        currentY += 20;

        const specX1 = 40, specX2 = 60, specX3 = 230, specX4 = 260;
        const drawSpec = (idx, label, val, y, isBoldVal = false) => {
            doc.font('Times-Roman').fontSize(8.5).text(`${idx}.`, specX1, y);
            doc.text(label, specX2, y);
            doc.text(':-', specX3 - 10, y);
            doc.font(isBoldVal ? 'Times-Bold' : 'Times-Roman').text(val || '', specX4, y, { width: 300 });
            return y + Math.max(12, doc.heightOfString(val || '', { width: 300 }));
        };

        currentY = drawSpec(1, 'Class of Vehicle', data.repair_type || 'MOTORCYCLE WITH GEAR', currentY, true);
        currentY = drawSpec(2, 'Makers Name', 'Bajaj Auto Ltd', currentY, true);
        currentY = drawSpec(3, 'Chassis Number', data.inv_chassis || '', currentY, true);
        currentY = drawSpec(4, 'Engine Number', data.in_engine || '', currentY, true);
        currentY = drawSpec(5, 'Horse Power', data.hp || ' ', currentY);
        currentY = drawSpec(6, 'Cubic Capacity', data.cc || ' ', currentY);
        currentY = drawSpec(7, 'Fuel Used', data.fuel || 'Petrol', currentY);
        currentY = drawSpec(8, 'No.of Cylinderes', data.no_of_cylider || '1', currentY);
        currentY = drawSpec(9, 'Seating Capacity( incl Driver)', data.seat_capacity || '1+1', currentY);
        currentY = drawSpec(10, 'Unladen Weight (Dry Weight)', data.ul_weight ? `${data.ul_weight} ` : ' ', currentY);
        currentY = drawSpec(11, 'Color/Colours of the Body', data.inv_color || '', currentY);
        currentY = drawSpec(12, 'Gross Vehicle Weight', data.r_weight ? `${data.r_weight} ` : ' ', currentY);
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
            doc.font('Times-Roman').fontSize(7.5).text(printedText, 40, 810, { lineBreak: false });
            doc.text(pageText, 500, 810, { lineBreak: false });
        }

        doc.end();
    } catch (err) {
        console.error('Sale Letter PDF Error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate Sale Letter PDF' });
    }
};

const createPrintEnquiryPdf = async (req, res) => {
    try {
        const [records] = await db.execute(
            `SELECT inv.*, pb.invoiceNo as purchase_bill_no, b.branch_name, b.branch_address, b.branch_ph
             FROM tbl_invoice_labour inv
             LEFT JOIN purchaseitem pi ON pi.chassis_no = inv.inv_chassis
             LEFT JOIN purchaseitembill pb ON pb.purchaseItemBillId = pi.purchaseItemBillId
             LEFT JOIN tbl_branch b ON b.b_id = inv.inv_branch
             WHERE inv.inv_chassis = ? ${req.user && req.user.role == 2 ? 'AND inv.inv_branch = ?' : ''}
             ORDER BY inv.inv_id DESC LIMIT 1`,
            req.user && req.user.role == 2 ? [req.params.chassisNo, req.user.branch_id] : [req.params.chassisNo]
        );

        if (!records.length) return res.status(404).json({ success: false, message: 'Vehicle not found' });
        const data = records[0];

        const doc = new PDFDocument({ margin: 30, size: 'A4', bufferPages: true });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="VehicleEnquiry_${data.inv_chassis}.pdf"`);
        doc.pipe(res);

        doc.font('Times-Bold').fontSize(16).text('Vehicle Enquiry', 40, 30, { align: 'center' });
        doc.moveTo(40, 55).lineTo(555, 55).lineWidth(1).stroke();

        let detailY = 70;
        const fieldX1 = 40, fieldX2 = 120, fieldX3 = 390, fieldX4 = 475;
        doc.font('Times-Bold').fontSize(8.5);

        const drawFieldRow = (label1, val1, label2, val2, y) => {
            doc.font('Times-Bold').text(label1, fieldX1, y);
            doc.text(':', fieldX2 - 10, y);
            doc.font('Times-Roman').text(val1 || '', fieldX2, y);

            doc.font('Times-Bold').text(label2, fieldX3, y);
            doc.text(':', fieldX4 - 10, y);
            doc.font('Times-Bold').text(val2 || '', fieldX4, y);
        };

        drawFieldRow('Chassis No.', data.inv_chassis, 'Vehicle Name', data.inv_vehicle, detailY); detailY += 15;
        drawFieldRow('Invoice Date', data.inv_inv_date ? new Date(data.inv_inv_date).toLocaleDateString('en-GB') : '', 'Regn Type', data.inv_type || '01', detailY); detailY += 15;
        drawFieldRow('Billed TO', data.inv_cus, 'CDMS.', data.inv_cdms_no, detailY); detailY += 15;
        drawFieldRow('Vehicle Code', data.inv_vehicle_code, '', '', detailY); detailY += 20;

        doc.moveTo(40, detailY).lineTo(555, detailY).lineWidth(1).stroke();
        detailY += 10;

        const col = { sl: 40, earn: 80, desc: 320, end: 555 };
        doc.font('Times-Bold').fontSize(8.5);
        doc.rect(col.sl, detailY, col.end - col.sl, 25).stroke();
        doc.text('Sl.No', col.sl + 5, detailY + 8);
        doc.text('.', col.sl + 5, detailY + 15);
        doc.text('Earning', col.earn + 5, detailY + 8);
        doc.text('Description', col.desc + 5, detailY + 8);

        doc.moveTo(col.earn, detailY).lineTo(col.earn, detailY + 25).stroke();
        doc.moveTo(col.desc, detailY).lineTo(col.desc, detailY + 25).stroke();

        detailY += 25;
        const rows = [
            { label: 'Customer Address', val: data.inv_cus_addres },
            { label: 'Father/Husband/Wife/Son', val: data.inv_cus_father_hus },
            { label: 'Area', val: data.inv_area },
            { label: 'Hypothication', val: data.inv_hypothication },
            { label: 'Engine No', val: data.in_engine },
            { label: 'Color', val: data.inv_color },
            { label: 'Purchase B.no', val: data.purchase_bill_no }
        ];

        rows.forEach((row, i) => {
            const h = Math.max(25, doc.heightOfString(row.val || '', { width: col.end - col.desc - 10 }) + 10);
            doc.rect(col.sl, detailY, col.end - col.sl, h).stroke();
            doc.moveTo(col.earn, detailY).lineTo(col.earn, detailY + h).stroke();
            doc.moveTo(col.desc, detailY).lineTo(col.desc, detailY + h).stroke();

            doc.font('Times-Roman').text((i + 1).toString(), col.sl + 5, detailY + 8, { width: col.earn - col.sl - 10, align: 'center' });
            doc.text(row.label, col.earn + 5, detailY + 8, { width: col.desc - col.earn - 10, align: 'center' });
            doc.font('Times-Bold').text(row.val || '', col.desc + 5, detailY + 8, { width: col.end - col.desc - 10, align: 'center' });
            detailY += h;
        });

        detailY += 40;
        doc.font('Times-Bold').fontSize(9).text('SARATHY MOTORS', col.end - 120, detailY, { width: 120, align: 'center' });
        doc.moveTo(col.end - 130, detailY + 12).lineTo(col.end - 10, detailY + 12).stroke();
        doc.font('Times-Bold').fontSize(8.5).text('Authorised Signatory', col.end - 120, detailY + 15, { width: 120, align: 'center' });

        doc.font('Times-Roman').fontSize(8.5).text('Sign of Customer Or His Agent', col.sl, detailY + 15);
        doc.font('Times-Bold').fontSize(9).text('Thank You & Happy Riding', col.sl, detailY + 15, { width: col.end - col.sl, align: 'center' });

        doc.moveTo(40, detailY + 40).lineTo(555, detailY + 40).dash(2, { space: 2 }).stroke().undash();

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
        console.error('Print Enquiry PDF Error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate Print Enquiry PDF' });
    }
};

module.exports = { searchVehicles, listModels, getVehicleByChassisNo, listChassis, createStickerPdf, createSaleLetterPdf, createPrintEnquiryPdf };
