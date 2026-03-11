const db = require('../config/db');
const PDFDocument = require('pdfkit');

function padSerial(n) { return String(n).padStart(5, '0'); }
function toNumber(value) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
}
function amount(value) {
    return toNumber(value).toFixed(2);
}
function pick(obj, ...keys) {
    for (const key of keys) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
        const value = obj[key];
        if (value === undefined || value === null) continue;
        if (typeof value === 'string' && value.trim() === '') continue;
        return value;
    }
    return undefined;
}
function calculateTotals(data) {
    const addTotal = toNumber(data.vehicleAmount) +
        toNumber(data.roadTax) +
        toNumber(data.insuranceAmount) +
        toNumber(data.regnFee) +
        toNumber(data.vpCharges) +
        toNumber(data.extendedWarranty) +
        toNumber(data.serviceStampCharges) +
        toNumber(data.fittingsAmt) +
        toNumber(data.bflInsOthers) +
        toNumber(data.advanceEmi) +
        toNumber(data.rsaAmount) +
        toNumber(data.ownershipAmt);

    const lessTotal = toNumber(data.financeAmount) +
        toNumber(data.advanceCash) +
        toNumber(data.bankTransfer) +
        toNumber(data.swipe) +
        toNumber(data.exchange) +
        toNumber(data.discount) +
        toNumber(data.bflDiscount) +
        toNumber(data.specialDiscount) +
        toNumber(data.duesAmt) +
        toNumber(data.gpay) +
        toNumber(data.others1) +
        toNumber(data.others2) +
        toNumber(data.others3);

    return {
        addTotal: addTotal.toFixed(2),
        lessTotal: lessTotal.toFixed(2),
        grandTotal: (addTotal - lessTotal).toFixed(2)
    };
}

async function getNextNo(branchId) {
    const year = new Date().getFullYear().toString();
    console.log(`[paySlipController] getNextNo for branchId: ${branchId}`);
    try {
        const [rows] = await db.execute('SELECT MAX(pay_slip_no) as last_no FROM tbl_payslip WHERE pay_branch_id = ?', [branchId]);
        const lastNo = rows[0]?.last_no;
        console.log(`[paySlipController] Last number found: ${lastNo}`);

        if (!lastNo || typeof lastNo !== 'string') {
            const next = `PS${year}${branchId}${padSerial(1)}`;
            console.log(`[paySlipController] No existing number or invalid. Returning: ${next}`);
            return next;
        }

        const lastSerial = parseInt(lastNo.slice(-5), 10) || 0;
        const lastYear = lastNo.substring(2, 6);
        const nextSerial = lastYear === year ? lastSerial + 1 : 1;
        const next = `PS${year}${branchId}${padSerial(nextSerial)}`;
        console.log(`[paySlipController] Generated next number: ${next}`);
        return next;
    } catch (error) {
        console.error(`[paySlipController] Error in getNextNo:`, error);
        throw error;
    }
}


const getNextPaySlipNo = async (req, res) => {
    let branchId = String(req.query.branchId || '').trim();
    const branchName = String(req.query.branchName || '').trim();

    console.log(`[paySlipController] getNextPaySlipNo called with branchId='${branchId}', branchName='${branchName}'`);

    // Enforce branch scoping for non-admins (role 2)
    if (req.user && req.user.role == 2) {
        branchId = String(req.user.branch_id || '').trim();
        console.log(`[paySlipController] Role 2 user, enforced branchId='${branchId}'`);
    }

    try {
        if (!branchId && branchName) {
            console.log(`[paySlipController] Fetching branchId for branchName='${branchName}'`);
            const [branchRows] = await db.execute(
                `SELECT b_id FROM tbl_branch WHERE TRIM(branch_name) = TRIM(?) LIMIT 1`,
                [branchName]
            );
            if (branchRows.length) {
                branchId = String(branchRows[0].b_id || '').trim();
                console.log(`[paySlipController] Found branchId='${branchId}'`);
            } else {
                console.log(`[paySlipController] No branch found for name='${branchName}'`);
            }
        }

        if (!branchId) {
            console.warn(`[paySlipController] No branchId provided or found. Cannot generate pay slip number.`);
            return res.status(400).json({ success: false, message: 'Branch name is required' });
        }

        const nextNo = await getNextNo(branchId);
        res.json({ success: true, paySlipNo: nextNo });
    } catch (err) {
        console.error(`[paySlipController] getNextPaySlipNo error:`, err);
        res.status(500).json({ success: false, message: 'Failed to generate pay slip number' });
    }
};

const getAdvisers = async (req, res) => {
    const branchName = req.query.branchName || req.query.branchName;
    try {
        let rows = [];
        if (branchName) {
            [rows] = await db.execute(
                `SELECT emp_id, e_first_name FROM tbl_employee
                 WHERE e_branch = ? AND e_designation = 'Executive'
                 ORDER BY e_first_name`, [branchName]
            );
        } else {
            [rows] = await db.execute(
                `SELECT emp_id, e_first_name FROM tbl_employee
                 WHERE e_designation = 'Executive'
                 ORDER BY e_first_name`
            );
        }
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch advisers' });
    }
};

const getPaySlipFormData = async (req, res) => {
    let branchId = req.query.branchId ? parseInt(req.query.branchId, 10) : null;

    if (req.user && req.user.role == 2) {
        branchId = parseInt(req.user.branch_id, 10);
    }

    try {
        const financeOptions = ['By Cash'];

        const [vehicleRows] = branchId
            ? await db.execute(
                `SELECT stock_id, stock_item_name, stock_item_code
                 FROM tbl_stock
                 WHERE stock_item_branch = ?
                 ORDER BY stock_item_name`,
                [branchId]
            )
            : await db.execute(
                `SELECT stock_id, stock_item_name, stock_item_code
                 FROM tbl_stock
                 ORDER BY stock_item_name`
            );

        const [executiveRows] = branchId
            ? await db.execute(
                `SELECT e.emp_id, e.e_first_name
                 FROM tbl_employee e
                 LEFT JOIN tbl_branch b ON b.branch_name = e.e_branch
                 WHERE b.b_id = ?
                 AND e.e_designation = 'Executive'
                 ORDER BY e.e_first_name`,
                [branchId]
            )
            : await db.execute(
                `SELECT emp_id, e_first_name FROM tbl_employee
                 WHERE e_designation = 'Executive'
                 ORDER BY e_first_name`
            );

        const [companyRows] = await db.execute(
            `SELECT icompany_name FROM tbl_insurance_company ORDER BY icompany_name`
        );

        for (const row of companyRows) {
            const name = (row.icompany_name || '').trim();
            if (name) financeOptions.push(name);
        }

        res.json({
            success: true,
            data: {
                vehicles: vehicleRows,
                executives: executiveRows,
                financeOptions
            }
        });
    } catch (err) {
        console.error('getPaySlipFormData error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch pay slip form data' });
    }
};


const listPaySlips = async (req, res) => {
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
            conditions.push('tbl_payslip.pay_branch_id = ?');
            params.push(branchId);
        }
        if (search) {
            conditions.push('(pay_slip_no LIKE ? OR pay_cus_name LIKE ? OR pay_vehil_type LIKE ? OR pay_slip_reference LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

        const [rows] = await db.execute(
            `SELECT
                tbl_payslip.payslip_id,
                tbl_payslip.pay_slip_no,
                tbl_payslip.pay_slip_date,
                tbl_payslip.pay_cus_name,
                tbl_payslip.pay_vehil_type,
                tbl_payslip.pay_vehile_amt,
                tbl_payslip.pay_remarks,
                tbl_payslip.pay_finance,
                tbl_payslip.pay_slip_reference,
                tbl_payslip.pay_regn,
                tbl_payslip.pay_grand_tot,
                tbl_payslip.pay_status,
                tbl_branch.branch_name
             FROM tbl_payslip
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_payslip.pay_branch_id
             ${where}
             ORDER BY payslip_id DESC
             LIMIT ${limit} OFFSET ${offset}`,
            params
        );

        const [countRows] = await db.execute(
            `SELECT COUNT(*) as total
             FROM tbl_payslip
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_payslip.pay_branch_id
             ${where}`,
            params
        );

        res.json({
            success: true,
            data: rows,
            total: countRows[0].total,
            page,
            limit
        });

    } catch (err) {
        console.error('listPaySlips error:', err.message || err);
        res.status(500).json({ success: false, message: 'Failed to fetch pay slips' });
    }
};

const savePaySlip = async (req, res) => {
    const body = req.body || {};
    const paySlipNo = pick(body, 'paySlipNo', 'pay_slip_no');
    let branchId = pick(body, 'branchId', 'pay_branch_id');
    const paySlipDate = pick(body, 'paySlipDate', 'pay_slip_date');
    const customerName = pick(body, 'customerName', 'pay_cus_name');
    const vehicleName = pick(body, 'vehicleName', 'pay_slip_reference');
    const vehicleType = pick(body, 'vehicleType', 'pay_vehil_type');
    const executiveName = pick(body, 'executiveName', 'adviserName', 'pay_regn', 'adviser_name');
    const remarks = pick(body, 'remarks', 'pay_remarks');
    const financeType = pick(body, 'financeType', 'pay_finance');
    const payStatus = pick(body, 'payStatus', 'pay_status');
    const vehicleAmount = pick(body, 'vehicleAmount', 'pay_vehile_amt');
    const roadTax = pick(body, 'roadTax', 'pay_road_tax');
    const insuranceAmount = pick(body, 'insuranceAmount', 'pay_insurance');
    const regnFee = pick(body, 'regnFee', 'pay_regn_fee');
    const vpCharges = pick(body, 'vpCharges', 'pay_vp_charge');
    const extendedWarranty = pick(body, 'extendedWarranty', 'pay_exted_wanty');
    const serviceStampCharges = pick(body, 'serviceStampCharges', 'pay_service_chrge');
    const fittingsAmt = pick(body, 'fittingsAmt', 'pay_fitting_amt');
    const bflInsOthers = pick(body, 'bflInsOthers', 'pay_others');
    const advanceEmi = pick(body, 'advanceEmi', 'pay_advan_install');
    const rsaAmount = pick(body, 'rsaAmount', 'pay_rsa_amt');
    const ownershipAmt = pick(body, 'ownershipAmt', 'pay_ownership_amt');
    const financeAmount = pick(body, 'financeAmount', 'pay_dcc');
    const advanceCash = pick(body, 'advanceCash', 'pay_advance');
    const bankTransfer = pick(body, 'bankTransfer', 'pay_bank_transfer');
    const swipe = pick(body, 'swipe', 'pay_swipe_amt');
    const exchange = pick(body, 'exchange', 'pay_exchange');
    const discount = pick(body, 'discount', 'pay_discount');
    const bflDiscount = pick(body, 'bflDiscount', 'pay_bfl');
    const specialDiscount = pick(body, 'specialDiscount', 'pay_special_discnt');
    const duesAmt = pick(body, 'duesAmt', 'pay_dues');
    const gpay = pick(body, 'gpay', 'pay_gpay');
    const others1 = pick(body, 'others1', 'pay_others1_amt');
    const others2 = pick(body, 'others2', 'pay_others2_amt');
    const others3 = pick(body, 'others3', 'pay_others3_amt');

    if (!paySlipNo) return res.status(400).json({ success: false, message: 'Pay slip number required' });

    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }

    if (!branchId) return res.status(400).json({ success: false, message: 'Branch id required' });

    try {
        const [dupCheck] = await db.execute('SELECT payslip_id FROM tbl_payslip WHERE pay_slip_no = ?', [paySlipNo]);
        if (dupCheck.length > 0) return res.status(409).json({ success: false, message: 'Pay slip number already exists' });

        const totals = calculateTotals({
            vehicleAmount, roadTax, insuranceAmount, regnFee, vpCharges,
            extendedWarranty, serviceStampCharges, fittingsAmt, bflInsOthers,
            advanceEmi, rsaAmount, ownershipAmt, financeAmount, advanceCash,
            bankTransfer, swipe, exchange, discount, bflDiscount, specialDiscount,
            duesAmt, gpay, others1, others2, others3
        });

        const [result] = await db.execute(
            `INSERT INTO tbl_payslip (
                pay_branch_id, pay_slip_no, pay_slip_date, pay_finance, pay_slip_reference, pay_regn,
                pay_regn_fee, pay_cus_name, pay_vehil_type, pay_vehile_amt, pay_remarks, pay_vp_charge, pay_insurance,
                pay_road_tax, pay_dcc, pay_exchange, pay_discount, pay_bfl, pay_advance, pay_dues, pay_exted_wanty,
                pay_service_chrge, pay_others, pay_advan_install, pay_rsa_amt, pay_ownership_amt, pay_bank_transfer,
                pay_swipe_amt, pay_special_discnt, pay_fitting_amt, pay_others1_amt, pay_others2_amt, pay_others3_amt,
                pay_gpay, pay_add_total, pay_less_total, pay_grand_tot, pay_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                branchId, paySlipNo, paySlipDate || new Date(), financeType || 'By Cash', vehicleName || '', executiveName || '',
                amount(regnFee), customerName || 'Internal/Employee', vehicleType || '', amount(vehicleAmount), remarks || '',
                amount(vpCharges), amount(insuranceAmount), amount(roadTax), amount(financeAmount), amount(exchange),
                amount(discount), amount(bflDiscount), amount(advanceCash), amount(duesAmt), amount(extendedWarranty),
                amount(serviceStampCharges), amount(bflInsOthers), amount(advanceEmi), amount(rsaAmount), amount(ownershipAmt),
                amount(bankTransfer), amount(swipe), amount(specialDiscount), amount(fittingsAmt),
                amount(others1), amount(others2), amount(others3), amount(gpay),
                totals.addTotal, totals.lessTotal, totals.grandTotal, payStatus || 'Open'
            ]
        );
        res.json({ success: true, message: 'Pay slip saved', payslip_id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to save pay slip' });
    }
};


const getPaySlip = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT tbl_payslip.*, tbl_branch.branch_name FROM tbl_payslip
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_payslip.pay_branch_id
             WHERE payslip_id = ?`, [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Pay slip not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch pay slip' });
    }
};

const updatePaySlip = async (req, res) => {
    const body = req.body || {};
    const paySlipDate = pick(body, 'paySlipDate', 'pay_slip_date');
    const customerName = pick(body, 'customerName', 'pay_cus_name');
    const vehicleName = pick(body, 'vehicleName', 'pay_slip_reference');
    const vehicleType = pick(body, 'vehicleType', 'pay_vehil_type');
    const executiveName = pick(body, 'executiveName', 'adviserName', 'pay_regn', 'adviser_name');
    const remarks = pick(body, 'remarks', 'pay_remarks');
    const financeType = pick(body, 'financeType', 'pay_finance');
    const payStatus = pick(body, 'payStatus', 'pay_status');
    const vehicleAmount = pick(body, 'vehicleAmount', 'pay_vehile_amt');
    const roadTax = pick(body, 'roadTax', 'pay_road_tax');
    const insuranceAmount = pick(body, 'insuranceAmount', 'pay_insurance');
    const regnFee = pick(body, 'regnFee', 'pay_regn_fee');
    const vpCharges = pick(body, 'vpCharges', 'pay_vp_charge');
    const extendedWarranty = pick(body, 'extendedWarranty', 'pay_exted_wanty');
    const serviceStampCharges = pick(body, 'serviceStampCharges', 'pay_service_chrge');
    const fittingsAmt = pick(body, 'fittingsAmt', 'pay_fitting_amt');
    const bflInsOthers = pick(body, 'bflInsOthers', 'pay_others');
    const advanceEmi = pick(body, 'advanceEmi', 'pay_advan_install');
    const rsaAmount = pick(body, 'rsaAmount', 'pay_rsa_amt');
    const ownershipAmt = pick(body, 'ownershipAmt', 'pay_ownership_amt');
    const financeAmount = pick(body, 'financeAmount', 'pay_dcc');
    const advanceCash = pick(body, 'advanceCash', 'pay_advance');
    const bankTransfer = pick(body, 'bankTransfer', 'pay_bank_transfer');
    const swipe = pick(body, 'swipe', 'pay_swipe_amt');
    const exchange = pick(body, 'exchange', 'pay_exchange');
    const discount = pick(body, 'discount', 'pay_discount');
    const bflDiscount = pick(body, 'bflDiscount', 'pay_bfl');
    const specialDiscount = pick(body, 'specialDiscount', 'pay_special_discnt');
    const duesAmt = pick(body, 'duesAmt', 'pay_dues');
    const gpay = pick(body, 'gpay', 'pay_gpay');
    const others1 = pick(body, 'others1', 'pay_others1_amt');
    const others2 = pick(body, 'others2', 'pay_others2_amt');
    const others3 = pick(body, 'others3', 'pay_others3_amt');

    try {
        const totals = calculateTotals({
            vehicleAmount, roadTax, insuranceAmount, regnFee, vpCharges,
            extendedWarranty, serviceStampCharges, fittingsAmt, bflInsOthers,
            advanceEmi, rsaAmount, ownershipAmt, financeAmount, advanceCash,
            bankTransfer, swipe, exchange, discount, bflDiscount, specialDiscount,
            duesAmt, gpay, others1, others2, others3
        });

        await db.execute(
            `UPDATE tbl_payslip SET
                pay_slip_date=?, pay_finance=?, pay_slip_reference=?, pay_regn=?, pay_regn_fee=?,
                pay_cus_name=?, pay_vehil_type=?, pay_vehile_amt=?, pay_remarks=?, pay_vp_charge=?, pay_insurance=?,
                pay_road_tax=?, pay_dcc=?, pay_exchange=?, pay_discount=?, pay_bfl=?, pay_advance=?, pay_dues=?,
                pay_exted_wanty=?, pay_service_chrge=?, pay_others=?, pay_advan_install=?, pay_rsa_amt=?,
                pay_ownership_amt=?, pay_bank_transfer=?, pay_swipe_amt=?, pay_special_discnt=?, pay_fitting_amt=?,
                pay_others1_amt=?, pay_others2_amt=?, pay_others3_amt=?, pay_gpay=?, pay_add_total=?, pay_less_total=?,
                pay_grand_tot=?, pay_status=?
             WHERE payslip_id=?`,
            [
                paySlipDate, financeType || 'By Cash', vehicleName || '', executiveName || '', amount(regnFee),
                customerName || 'Internal/Employee', vehicleType || '', amount(vehicleAmount), remarks || '',
                amount(vpCharges), amount(insuranceAmount), amount(roadTax), amount(financeAmount), amount(exchange),
                amount(discount), amount(bflDiscount), amount(advanceCash), amount(duesAmt), amount(extendedWarranty),
                amount(serviceStampCharges), amount(bflInsOthers), amount(advanceEmi), amount(rsaAmount),
                amount(ownershipAmt), amount(bankTransfer), amount(swipe), amount(specialDiscount),
                amount(fittingsAmt), amount(others1), amount(others2), amount(others3), amount(gpay),
                totals.addTotal, totals.lessTotal, totals.grandTotal, payStatus || 'Open',
                req.params.id
            ]
        );
        res.json({ success: true, message: 'Pay slip updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to update pay slip' });
    }
};


const createPdf = async (req, res) => {
    try {
        const [records] = await db.execute(
            `SELECT tbl_payslip.*, tbl_branch.branch_location FROM tbl_payslip
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_payslip.pay_branch_id
             WHERE payslip_id = ? ${req.user && req.user.role == 2 ? 'AND pay_branch_id = ?' : ''}`,
            req.user && req.user.role == 2 ? [req.params.id, req.user.branch_id] : [req.params.id]
        );

        if (!records.length) return res.status(404).json({ success: false, message: 'Pay slip not found' });
        const data = records[0];

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        let filename = `PaySlip_${data.pay_slip_no}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        doc.pipe(res);

        // --- Header Section ---
        doc.font('Times-Bold').fontSize(16).text('Pay slip(Vehicle)', { align: 'center' });
        doc.moveDown(1.5);

        const leftX = 40;
        const rightX = 350;
        let startY = doc.y;

        const drawInfo = (label, value, x, y) => {
            const cleanValue = (value || '').toString().replace(/\r/g, '');
            doc.font('Times-Bold').fontSize(9).text(label, x, y);
            doc.font('Times-Roman').fontSize(9).text(`: ${cleanValue || '—'}`, x + 75, y, { width: 150 });
        };

        drawInfo('Pay Slip No.', data.pay_slip_no, leftX, startY);
        drawInfo('Vehicle Name', data.pay_slip_reference, rightX, startY);

        startY += 18;
        drawInfo('Pay Slip Date', data.pay_slip_date ? new Date(data.pay_slip_date).toLocaleDateString('en-GB') : '', leftX, startY);
        drawInfo('Executive', data.pay_regn || '', rightX, startY);

        startY += 18;
        drawInfo('Billed TO', data.pay_cus_name, leftX, startY);
        drawInfo('Remarks.', data.pay_remarks, rightX, startY);

        startY += 18;
        drawInfo('Vehicle Type', data.pay_vehil_type, leftX, startY);
        drawInfo('Location.', data.branch_location, rightX, startY);

        startY += 18;
        drawInfo('Finance/Cash', data.pay_finance, leftX, startY);

        doc.moveDown(2);

        // --- Table Section ---
        const tableStartY = doc.y;
        const x1 = 40, x2 = 70, x3 = 220, x4 = 310, x5 = 460, x6 = 560;
        const tableWidth = x6 - x1;
        const rowHeight = 15;

        // Helper to format amount
        const fmt = (v) => {
            const n = parseFloat(v);
            return isNaN(n) ? '0.00' : n.toFixed(2);
        };

        // Table Header
        doc.font('Times-Bold').fontSize(9);
        doc.rect(x1, tableStartY, tableWidth, rowHeight + 5).stroke();
        doc.text('Sl.No', x1 + 2, tableStartY + 5);
        doc.text('Earning', x2 + 5, tableStartY + 5);
        doc.text('Amount', x3, tableStartY + 5, { width: x4 - x3 - 5, align: 'right' });
        doc.text('Deductions', x4 + 5, tableStartY + 5);
        doc.text('Amount', x5, tableStartY + 5, { width: x6 - x5 - 5, align: 'right' });

        // Vertical lines for header
        doc.moveTo(x2, tableStartY).lineTo(x2, tableStartY + rowHeight + 5).stroke();
        doc.moveTo(x3, tableStartY).lineTo(x3, tableStartY + rowHeight + 5).stroke();
        doc.moveTo(x4, tableStartY).lineTo(x4, tableStartY + rowHeight + 5).stroke();
        doc.moveTo(x5, tableStartY).lineTo(x5, tableStartY + rowHeight + 5).stroke();

        let currentY = tableStartY + rowHeight + 5;

        const earnings = [
            { label: 'Vehicle Amount', val: data.pay_vehile_amt },
            { label: 'Road Tax', val: data.pay_road_tax },
            { label: 'Insurance', val: data.pay_insurance },
            { label: 'Reg Fee', val: data.pay_regn_fee },
            { label: 'V.P Charges', val: data.pay_vp_charge },
            { label: 'Ex Warrenty', val: data.pay_exted_wanty },
            { label: 'Service & Stamp', val: data.pay_service_chrge },
            { label: 'BFL Insurance&others', val: data.pay_others },
            { label: 'Advance EMI', val: data.pay_advan_install },
            { label: 'RSA Amount', val: data.pay_rsa_amt },
            { label: 'Ownership Amount', val: data.pay_ownership_amt },
            { label: 'Fittings Amount', val: data.pay_fitting_amt },
            { label: '', val: '' }
        ];

        const deductions = [
            { label: 'Finanace Amount', val: data.pay_dcc },
            { label: 'Advance Amount', val: data.pay_advance },
            { label: 'Bank Transfer', val: data.pay_bank_transfer },
            { label: 'Swipe', val: data.pay_swipe_amt },
            { label: 'Exchange', val: data.pay_exchange },
            { label: 'Discount', val: data.pay_discount },
            { label: 'BFL Discount', val: data.pay_bfl },
            { label: 'Special Discount', val: data.pay_special_discnt },
            { label: 'Dues', val: data.pay_dues },
            { label: 'Gpay', val: data.pay_gpay },
            { label: 'Others1', val: data.pay_others1_amt },
            { label: 'Others2', val: data.pay_others2_amt },
            { label: 'Others3', val: data.pay_others3_amt }
        ];

        doc.font('Times-Roman').fontSize(8);
        for (let i = 0; i < 13; i++) {
            doc.rect(x1, currentY, tableWidth, rowHeight).stroke();

            // Verticals
            doc.moveTo(x2, currentY).lineTo(x2, currentY + rowHeight).stroke();
            doc.moveTo(x3, currentY).lineTo(x3, currentY + rowHeight).stroke();
            doc.moveTo(x4, currentY).lineTo(x4, currentY + rowHeight).stroke();
            doc.moveTo(x5, currentY).lineTo(x5, currentY + rowHeight).stroke();

            doc.text(i + 1, x1 + 4, currentY + 4);

            // Earning
            if (earnings[i].label) {
                doc.text(earnings[i].label, x2 + 4, currentY + 4);
                if (earnings[i].val) doc.text(fmt(earnings[i].val), x3, currentY + 4, { width: x4 - x3 - 5, align: 'right' });
            }

            // Deduction
            if (deductions[i].label) {
                doc.text(deductions[i].label, x4 + 4, currentY + 4);
                if (deductions[i].val) doc.text(fmt(deductions[i].val), x5, currentY + 4, { width: x6 - x5 - 5, align: 'right' });
            }

            currentY += rowHeight;
        }

        // Totals Row
        doc.font('Times-Bold');
        doc.rect(x1, currentY, tableWidth, rowHeight).stroke();
        doc.moveTo(x3, currentY).lineTo(x3, currentY + rowHeight).stroke();
        doc.moveTo(x4, currentY).lineTo(x4, currentY + rowHeight).stroke();
        doc.moveTo(x5, currentY).lineTo(x5, currentY + rowHeight).stroke();

        doc.text('Total', x1, currentY + 4, { width: x3 - x1, align: 'center' });
        doc.text(`${fmt(data.pay_add_total)}/-`, x3, currentY + 4, { width: x4 - x3 - 5, align: 'right' });

        doc.text('Total', x4, currentY + 4, { width: x5 - x4, align: 'center' });
        doc.text(`${fmt(data.pay_less_total)}/-`, x5, currentY + 4, { width: x6 - x5 - 5, align: 'right' });

        currentY += rowHeight + 10;

        // --- Bottom Summary ---
        doc.font('Times-Bold').fontSize(9);
        doc.text('BALANCE AMOUNT', x1, currentY);
        doc.text(`RS: ${fmt(data.pay_grand_tot)}/-`, x1 + 130, currentY);

        currentY += 18;
        doc.text('Tax amount payable on reverse charges (in Rs.) : Nil', x1, currentY);

        currentY += 30;
        doc.lineWidth(0.5).dash(2, { space: 2 }).moveTo(x1, currentY).lineTo(x6, currentY).stroke().undash();

        // Footer Metadata
        doc.fontSize(7).font('Times-Roman');
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();

        doc.text(`Printed On: ${dateStr}, ${timeStr}`, x1, 800);
        doc.text('Page 1/1', x6 - 45, 800);

        doc.end();

    } catch (err) {
        console.error('PDF Generation Error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate PDF' });
    }
};

const createPdfByNo = async (req, res) => {
    try {
        const [records] = await db.execute(
            `SELECT tbl_payslip.*, tbl_branch.branch_location FROM tbl_payslip
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_payslip.pay_branch_id
             WHERE pay_slip_no = ?`, [req.params.no]
        );

        if (!records.length) return res.status(404).json({ success: false, message: 'Pay slip not found' });
        const data = records[0];

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        let filename = `PaySlip_${data.pay_slip_no}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        doc.pipe(res);

        // --- Header Section ---
        doc.font('Times-Bold').fontSize(16).text('Pay slip(Vehicle)', { align: 'center' });
        doc.moveDown(1.5);

        const leftX = 40;
        const rightX = 350;
        let startY = doc.y;

        const drawInfo = (label, value, x, y) => {
            const cleanValue = (value || '').toString().replace(/\r/g, '');
            doc.font('Times-Bold').fontSize(9).text(label, x, y);
            doc.font('Times-Roman').fontSize(9).text(`: ${cleanValue || '—'}`, x + 75, y, { width: 150 });
        };

        drawInfo('Pay Slip No.', data.pay_slip_no, leftX, startY);
        drawInfo('Vehicle Name', data.pay_slip_reference, rightX, startY);

        startY += 18;
        drawInfo('Pay Slip Date', data.pay_slip_date ? new Date(data.pay_slip_date).toLocaleDateString('en-GB') : '', leftX, startY);
        drawInfo('Executive', data.pay_regn || '', rightX, startY);

        startY += 18;
        drawInfo('Billed TO', data.pay_cus_name, leftX, startY);
        drawInfo('Remarks.', data.pay_remarks, rightX, startY);

        startY += 18;
        drawInfo('Vehicle Type', data.pay_vehil_type, leftX, startY);
        drawInfo('Location.', data.branch_location, rightX, startY);

        startY += 18;
        drawInfo('Finance/Cash', data.pay_finance, leftX, startY);

        doc.moveDown(2);

        // --- Table Section ---
        const tableStartY = doc.y;
        const x1 = 40, x2 = 70, x3 = 220, x4 = 310, x5 = 460, x6 = 560;
        const tableWidth = x6 - x1;
        const rowHeight = 15;

        // Helper to format amount
        const fmt = (v) => {
            const n = parseFloat(v);
            return isNaN(n) ? '0.00' : n.toFixed(2);
        };

        // Table Header
        doc.font('Times-Bold').fontSize(9);
        doc.rect(x1, tableStartY, tableWidth, rowHeight + 5).stroke();
        doc.text('Sl.No', x1 + 2, tableStartY + 5);
        doc.text('Earning', x2 + 5, tableStartY + 5);
        doc.text('Amount', x3, tableStartY + 5, { width: x4 - x3 - 5, align: 'right' });
        doc.text('Deductions', x4 + 5, tableStartY + 5);
        doc.text('Amount', x5, tableStartY + 5, { width: x6 - x5 - 5, align: 'right' });

        // Vertical lines for header
        doc.moveTo(x2, tableStartY).lineTo(x2, tableStartY + rowHeight + 5).stroke();
        doc.moveTo(x3, tableStartY).lineTo(x3, tableStartY + rowHeight + 5).stroke();
        doc.moveTo(x4, tableStartY).lineTo(x4, tableStartY + rowHeight + 5).stroke();
        doc.moveTo(x5, tableStartY).lineTo(x5, tableStartY + rowHeight + 5).stroke();

        let currentY = tableStartY + rowHeight + 5;

        const earnings = [
            { label: 'Vehicle Amount', val: data.pay_vehile_amt },
            { label: 'Road Tax', val: data.pay_road_tax },
            { label: 'Insurance', val: data.pay_insurance },
            { label: 'Reg Fee', val: data.pay_regn_fee },
            { label: 'V.P Charges', val: data.pay_vp_charge },
            { label: 'Ex Warrenty', val: data.pay_exted_wanty },
            { label: 'Service & Stamp', val: data.pay_service_chrge },
            { label: 'BFL Insurance&others', val: data.pay_others },
            { label: 'Advance EMI', val: data.pay_advan_install },
            { label: 'RSA Amount', val: data.pay_rsa_amt },
            { label: 'Ownership Amount', val: data.pay_ownership_amt },
            { label: 'Fittings Amount', val: data.pay_fitting_amt },
            { label: '', val: '' }
        ];

        const deductions = [
            { label: 'Finanace Amount', val: data.pay_dcc },
            { label: 'Advance Amount', val: data.pay_advance },
            { label: 'Bank Transfer', val: data.pay_bank_transfer },
            { label: 'Swipe', val: data.pay_swipe_amt },
            { label: 'Exchange', val: data.pay_exchange },
            { label: 'Discount', val: data.pay_discount },
            { label: 'BFL Discount', val: data.pay_bfl },
            { label: 'Special Discount', val: data.pay_special_discnt },
            { label: 'Dues', val: data.pay_dues },
            { label: 'Gpay', val: data.pay_gpay },
            { label: 'Others1', val: data.pay_others1_amt },
            { label: 'Others2', val: data.pay_others2_amt },
            { label: 'Others3', val: data.pay_others3_amt }
        ];

        doc.font('Times-Roman').fontSize(8);
        for (let i = 0; i < 13; i++) {
            doc.rect(x1, currentY, tableWidth, rowHeight).stroke();

            // Verticals
            doc.moveTo(x2, currentY).lineTo(x2, currentY + rowHeight).stroke();
            doc.moveTo(x3, currentY).lineTo(x3, currentY + rowHeight).stroke();
            doc.moveTo(x4, currentY).lineTo(x4, currentY + rowHeight).stroke();
            doc.moveTo(x5, currentY).lineTo(x5, currentY + rowHeight).stroke();

            doc.text(i + 1, x1 + 4, currentY + 4);

            // Earning
            if (earnings[i].label) {
                doc.text(earnings[i].label, x2 + 4, currentY + 4);
                if (earnings[i].val) doc.text(fmt(earnings[i].val), x3, currentY + 4, { width: x4 - x3 - 5, align: 'right' });
            }

            // Deduction
            if (deductions[i].label) {
                doc.text(deductions[i].label, x4 + 4, currentY + 4);
                if (deductions[i].val) doc.text(fmt(deductions[i].val), x5, currentY + 4, { width: x6 - x5 - 5, align: 'right' });
            }

            currentY += rowHeight;
        }

        // Totals Row
        doc.font('Times-Bold');
        doc.rect(x1, currentY, tableWidth, rowHeight).stroke();
        doc.moveTo(x3, currentY).lineTo(x3, currentY + rowHeight).stroke();
        doc.moveTo(x4, currentY).lineTo(x4, currentY + rowHeight).stroke();
        doc.moveTo(x5, currentY).lineTo(x5, currentY + rowHeight).stroke();

        doc.text('Total', x1, currentY + 4, { width: x3 - x1, align: 'center' });
        doc.text(`${fmt(data.pay_add_total)}/-`, x3, currentY + 4, { width: x4 - x3 - 5, align: 'right' });

        doc.text('Total', x4, currentY + 4, { width: x5 - x4, align: 'center' });
        doc.text(`${fmt(data.pay_less_total)}/-`, x5, currentY + 4, { width: x6 - x5 - 5, align: 'right' });

        currentY += rowHeight + 10;

        // --- Bottom Summary ---
        doc.font('Times-Bold').fontSize(9);
        doc.text('BALANCE AMOUNT', x1, currentY);
        doc.text(`RS: ${fmt(data.pay_grand_tot)}/-`, x1 + 130, currentY);

        currentY += 18;
        doc.text('Tax amount payable on reverse charges (in Rs.) : Nil', x1, currentY);

        currentY += 30;
        doc.lineWidth(0.5).dash(2, { space: 2 }).moveTo(x1, currentY).lineTo(x6, currentY).stroke().undash();

        // Footer Metadata
        doc.fontSize(7).font('Times-Roman');
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();

        doc.text(`Printed On: ${dateStr}, ${timeStr}`, x1, 800);
        doc.text('Page 1/1', x6 - 45, 800);

        doc.end();

    } catch (err) {
        console.error('PDF Generation Error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate PDF' });
    }
};

module.exports = {
    getNextPaySlipNo,
    getAdvisers,
    getPaySlipFormData,
    listPaySlips,
    savePaySlip,
    getPaySlip,
    updatePaySlip,
    createPdf,
    createPdfByNo
};
