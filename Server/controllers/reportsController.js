const db = require('../config/db');
const ExcelJS = require('exceljs');

const getSalesReport = async (req, res) => {
    let { branchId, from, to, vehicleCode } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });
    try {
        let conditions = ["DATE(tbl_invoice_labour.inv_inv_date) BETWEEN ? AND ?", "(tbl_invoice_labour.inv_type = 'sale' OR tbl_invoice_labour.inv_type = '01')"];
        let params = [from, to];

        if (branchId) {
            conditions.push('tbl_invoice_labour.inv_branch = ?');
            params.push(branchId);
        }

        if (vehicleCode) {
            const codes = Array.isArray(vehicleCode) ? vehicleCode : vehicleCode.split(',').filter(c => c.trim() !== '');
            if (codes.length > 0) {
                const placeholders = codes.map(() => 'LOWER(TRIM(?))').join(',');
                conditions.push(`LOWER(TRIM(tbl_invoice_labour.inv_vehicle_code)) IN (${placeholders})`);
                params.push(...codes.map(c => c.trim().toLowerCase()));
            }
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const query = `SELECT tbl_invoice_labour.*, tbl_branch.branch_name FROM tbl_invoice_labour
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_invoice_labour.inv_branch
             ${where} ORDER BY inv_inv_date DESC LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await db.execute(query, params);

        const [countRows] = await db.execute(`SELECT COUNT(*) as total FROM tbl_invoice_labour ${where}`, params);
        res.json({ success: true, data: rows, total: countRows[0].total, page, limit });
    } catch (err) {
        console.error('getSalesReport error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch sales report', error: err.message });
    }
};

const getPurchaseReport = async (req, res) => {
    let { branchId, from, to, vehicleCode } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });
    try {
        let conditions = ["DATE(pb.rac_date) BETWEEN ? AND ?"];
        let params = [from, to];

        if (branchId) {
            conditions.push('pb.purch_branchId = ?');
            params.push(branchId);
        }

        if (vehicleCode) {
            const codes = Array.isArray(vehicleCode) ? vehicleCode : vehicleCode.split(',').filter(c => c.trim() !== '');
            if (codes.length > 0) {
                const placeholders = codes.map(() => 'LOWER(TRIM(?))').join(',');
                conditions.push(`LOWER(TRIM(pi.materialsId)) IN (${placeholders})`);
                params.push(...codes.map(c => c.trim().toLowerCase()));
            }
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const query = `SELECT 
                pb.purchaseItemBillId,
                pb.invoiceNo, 
                pb.rac_date, 
                pb.purch_branchId, 
                b.branch_name, 
                b.branch_id,
                pb.pucha_vendorName, 
                pi.purchaseItemId,
                pi.materialsId, 
                pi.materialName,
                pb.invoiceDate, 
                pi.chassis_no, 
                pi.engine_no, 
                pi.color_name, 
                pb.total_bill_amount
             FROM purchaseitembill pb
             LEFT JOIN purchaseitem pi ON pi.purchaseItemBillId = pb.purchaseItemBillId
             LEFT JOIN tbl_branch b ON b.b_id = pb.purch_branchId
             ${where} 
             ORDER BY pb.rac_date 
             LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await db.execute(query, params);

        const [countRows] = await db.execute(`
            SELECT COUNT(*) as total 
            FROM purchaseitembill pb
            LEFT JOIN purchaseitem pi ON pi.purchaseItemBillId = pb.purchaseItemBillId
            ${where}`, params);
        res.json({ success: true, data: rows, total: countRows[0].total, page, limit });
    } catch (err) {
        console.error('getPurchaseReport error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch purchase report', error: err.message });
    }
};

const getMoneyReceiptReport = async (req, res) => {
    let { branchId, from, to } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });
    try {
        let conditions = ['DATE(receipt_date) BETWEEN ? AND ?'];
        let params = [from, to];

        if (branchId) {
            conditions.push('tbl_money_receipt.rec_branch_id = ?');
            params.push(branchId);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const [rows] = await db.execute(
            `SELECT tbl_money_receipt.*, tbl_branch.branch_name FROM tbl_money_receipt
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_money_receipt.rec_branch_id
             ${where} ORDER BY receipt_date DESC LIMIT ${limit} OFFSET ${offset}`,
            params);

        const [countRows] = await db.execute(`SELECT COUNT(*) as total FROM tbl_money_receipt ${where}`, params);
        res.json({ success: true, data: rows, total: countRows[0].total, page, limit });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to fetch money receipt report' }); }
};

const getPaySlipReport = async (req, res) => {
    let { branchId, from, to } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });
    try {
        let conditions = ['DATE(pay_slip_date) BETWEEN ? AND ?'];
        let params = [from, to];

        if (branchId) {
            conditions.push('tbl_payslip.pay_branch_id = ?');
            params.push(branchId);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const [rows] = await db.execute(
            `SELECT tbl_payslip.*, tbl_branch.branch_name FROM tbl_payslip
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_payslip.pay_branch_id
             ${where} ORDER BY pay_slip_date DESC LIMIT ${limit} OFFSET ${offset}`,
            params);

        const [countRows] = await db.execute(`SELECT COUNT(*) as total FROM tbl_payslip ${where}`, params);
        res.json({ success: true, data: rows, total: countRows[0].total, page, limit });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to fetch pay slip report' }); }
};

const getBranchTransferReport = async (req, res) => {
    let { branchId, from, to } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });
    try {
        let conditions = ['DATE(debit_note_date) BETWEEN ? AND ?'];
        let params = [from, to];

        if (branchId) {
            conditions.push('tbl_branch_transfer.ic_branch = ?');
            params.push(branchId);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const [rows] = await db.execute(
            `SELECT tbl_branch_transfer.*, b1.branch_name as from_branch_name, b1.branch_id as from_branch_id, 
                    b2.branch_name as to_branch_name, b2.branch_address as to_branch_address
             FROM tbl_branch_transfer
             LEFT JOIN tbl_branch b1 ON b1.b_id = tbl_branch_transfer.ic_branch
             LEFT JOIN tbl_branch b2 ON b2.b_id = tbl_branch_transfer.lnstitute_branch_id
             ${where} ORDER BY debit_note_date DESC LIMIT ${limit} OFFSET ${offset}`,
            params);

        const [countRows] = await db.execute(`SELECT COUNT(*) as total FROM tbl_branch_transfer ${where}`, params);
        res.json({ success: true, data: rows, total: countRows[0].total, page, limit });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to fetch branch transfer report' }); }
};

const getProformaReport = async (req, res) => {
    let { branchId, from, to, status } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });
    try {
        let conditions = ['DATE(pro_date) BETWEEN ? AND ?'];
        let params = [from, to];

        if (branchId) {
            conditions.push('pro_branch = ?');
            params.push(branchId);
        }
        if (status) {
            conditions.push('pro_status = ?');
            params.push(status === 'Open' ? 1 : 2);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const [rows] = await db.execute(
            `SELECT tbl_proforma.*, tbl_branch.branch_name, tbl_branch.branch_id FROM tbl_proforma
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_proforma.pro_branch
             ${where} ORDER BY pro_date DESC LIMIT ${limit} OFFSET ${offset}`,
            params);

        const [countRows] = await db.execute(`SELECT COUNT(*) as total FROM tbl_proforma ${where}`, params);

        res.json({ success: true, data: rows, total: countRows[0].total, page, limit });
    } catch (err) {
        console.error('getProformaReport error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch proforma report' });
    }
};

const getVsiReport = async (req, res) => {
    let { branchId, from, to } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });
    try {
        let conditions = ['DATE(vsi_date) BETWEEN ? AND ?'];
        let params = [from, to];

        if (branchId) {
            conditions.push('tbl_vsi_invoice.vsi_branch = ?');
            params.push(branchId);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const [rows] = await db.execute(
            `SELECT tbl_vsi_invoice.*, tbl_branch.branch_name FROM tbl_vsi_invoice
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_vsi_invoice.vsi_branch
             ${where} ORDER BY vsi_date DESC LIMIT ${limit} OFFSET ${offset}`,
            params);

        const [countRows] = await db.execute(`SELECT COUNT(*) as total FROM tbl_vsi_invoice ${where}`, params);
        res.json({ success: true, data: rows, total: countRows[0].total, page, limit });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to fetch VSI report' }); }
};

const exportProformaExcel = async (req, res) => {
    let { branchId, from, to, status } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });

    try {
        let conditions = ['DATE(pro_date) BETWEEN ? AND ?'];
        let params = [from, to];

        if (branchId) {
            conditions.push('pro_branch = ?');
            params.push(branchId);
        }
        if (status) {
            conditions.push('pro_status = ?');
            params.push(status === 'Open' ? 1 : 2);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const [rows] = await db.execute(
            `SELECT tbl_proforma.*, tbl_branch.branch_name, tbl_branch.branch_id FROM tbl_proforma
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_proforma.pro_branch
             ${where} ORDER BY pro_date DESC`,
            params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Proforma Report');

        // Define columns
        worksheet.columns = [
            { header: 'SINO', key: 'sino', width: 8 },
            { header: 'QUOTATION NO', key: 'quot_no', width: 20 },
            { header: 'QUOTATION DATE', key: 'quot_date', width: 15 },
            { header: 'BRANCH', key: 'branch', width: 25 },
            { header: 'CUSTOMER', key: 'customer', width: 25 },
            { header: 'ADDRESS', key: 'address', width: 35 },
            { header: 'CONTACT NO', key: 'contact', width: 15 },
            { header: 'TYPE', key: 'type', width: 12 },
            { header: 'REFERENCE', key: 'ref', width: 20 },
            { header: 'TAXABLE AMOUNT', key: 'taxable', width: 15 },
            { header: 'SGST', key: 'sgst', width: 12 },
            { header: 'CGST', key: 'cgst', width: 12 },
            { header: 'TOTAL', key: 'total', width: 15 },
            { header: 'MISSELANEOUS1', key: 'miss1', width: 15 },
            { header: 'MISSELANEOUS2', key: 'miss2', width: 15 },
            { header: 'LESS', key: 'less', width: 10 },
            { header: 'GRAND TOTAL', key: 'grand', width: 15 }
        ];

        // Bold the header row
        worksheet.getRow(1).font = { bold: true };

        // Add data rows
        rows.forEach((r, i) => {
            worksheet.addRow({
                sino: i + 1,
                quot_no: r.pro_quot_no,
                quot_date: r.pro_date ? new Date(r.pro_date).toLocaleDateString('en-GB') : '',
                branch: `${r.branch_name} (${r.branch_id})`,
                customer: r.pro_cus_name,
                address: r.pro_cus_address,
                contact: r.pro_contact,
                type: r.pro_type_loan,
                ref: r.pro_ref,
                taxable: parseFloat(r.pro_vehi_tax_total || 0),
                sgst: parseFloat(r.pro_vehi_sgst_total || 0),
                cgst: parseFloat(r.pro_vehi_cgst_total || 0),
                total: parseFloat(r.pro_vehicle_total || 0),
                miss1: parseFloat(r.pro_missal1_amt || 0),
                miss2: parseFloat(r.pro_missal2_amt || 0),
                less: parseFloat(r.pro_less || 0),
                grand: parseFloat(r.pro_grand_total || 0)
            });
        });

        const totalInvoiceAmount = rows.reduce((acc, r) => acc + (parseFloat(r.pro_grand_total) || 0), 0);

        // Add footer row
        const footerRow = worksheet.addRow({
            ref: 'Total Invoice Amount:-',
            grand: totalInvoiceAmount
        });

        // Bold the footer row
        footerRow.font = { bold: true };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=ProformaReport_${from}_to_${to}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('exportProformaExcel error:', err);
        res.status(500).json({ success: false, message: 'Failed to export Excel' });
    }
};

const exportProformaPagedExcel = async (req, res) => {
    let { branchId, from, to, status } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });

    try {
        let conditions = ['DATE(pro_date) BETWEEN ? AND ?'];
        let params = [from, to];

        if (branchId) {
            conditions.push('pro_branch = ?');
            params.push(branchId);
        }
        if (status) {
            conditions.push('pro_status = ?');
            params.push(status === 'Open' ? 1 : 2);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const [rows] = await db.execute(
            `SELECT tbl_proforma.*, tbl_branch.branch_name, tbl_branch.branch_id FROM tbl_proforma
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_proforma.pro_branch
             ${where} ORDER BY pro_date DESC LIMIT ${limit} OFFSET ${offset}`,
            params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Proforma Page');

        // Main Title
        worksheet.mergeCells('A1:M1');
        const titleRow = worksheet.getRow(1);
        titleRow.getCell(1).value = 'List Proforma Invoice Summary';
        titleRow.getCell(1).alignment = { horizontal: 'center' };
        titleRow.getCell(1).font = { bold: true };
        titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

        // Define columns starting from row 2
        worksheet.getRow(2).values = [
            'QUOTATION NO', 'DATE & STATUS', 'BRANCH', 'CUSTOMER DETAILS', 'TYPE',
            'TAXABLE', 'SGST', 'CGST', 'TOTAL', 'MISC1', 'MISC2', 'LESS', 'GRAND TOTAL'
        ];
        worksheet.getRow(2).font = { bold: true };

        rows.forEach((r, i) => {
            const dateStr = r.pro_date ? new Date(r.pro_date).toISOString().split('T')[0] : '';
            const statusStr = r.pro_status == 1 ? 'Open' : 'Closed';

            worksheet.addRow([
                `${r.pro_quot_no}`,
                `${dateStr} Quotation Status:${statusStr}`,
                `${r.branch_name} (${r.branch_id})`,
                `${r.pro_cus_name} Mob: ${r.pro_contact} Company Address: ${r.pro_cus_address}`,
                r.pro_type_loan || '',
                parseFloat(r.pro_vehi_tax_total || 0),
                parseFloat(r.pro_vehi_sgst_total || 0),
                parseFloat(r.pro_vehi_cgst_total || 0),
                parseFloat(r.pro_vehicle_total || 0),
                `Amount: ${parseFloat(r.pro_missal1_amt || 0).toFixed(2)}`,
                `Amount: ${parseFloat(r.pro_missal2_amt || 0).toFixed(2)}`,
                parseFloat(r.pro_less || 0),
                parseFloat(r.pro_grand_total || 0)
            ]);
        });

        worksheet.columns.forEach(col => { col.width = 25; });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=ProformaPaged_${page}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('exportProformaPagedExcel error:', err);
        res.status(500).json({ success: false, message: 'Failed to export paged Excel' });
    }
};

const exportProformaPagedCsv = async (req, res) => {
    let { branchId, from, to, status } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });

    try {
        let conditions = ['DATE(pro_date) BETWEEN ? AND ?'];
        let params = [from, to];

        if (branchId) {
            conditions.push('pro_branch = ?');
            params.push(branchId);
        }
        if (status) {
            conditions.push('pro_status = ?');
            params.push(status === 'Open' ? 1 : 2);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const [rows] = await db.execute(
            `SELECT tbl_proforma.*, tbl_branch.branch_name, tbl_branch.branch_id FROM tbl_proforma
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_proforma.pro_branch
             ${where} ORDER BY pro_date DESC LIMIT ${limit} OFFSET ${offset}`,
            params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Proforma Page');

        worksheet.addRow([
            'QUOTATION NO', 'DATE & STATUS', 'BRANCH', 'CUSTOMER DETAILS', 'TYPE',
            'TAXABLE', 'SGST', 'CGST', 'TOTAL', 'MISC1', 'MISC2', 'LESS', 'GRAND TOTAL'
        ]);

        rows.forEach((r) => {
            const dateStr = r.pro_date ? new Date(r.pro_date).toISOString().split('T')[0] : '';
            const statusStr = r.pro_status == 1 ? 'Open' : 'Closed';

            worksheet.addRow([
                `${r.pro_quot_no}`,
                `${dateStr} Quotation Status:${statusStr}`,
                `${r.branch_name} (${r.branch_id})`,
                `${r.pro_cus_name} Mob: ${r.pro_contact} Company Address: ${r.pro_cus_address}`,
                r.pro_type_loan || '',
                parseFloat(r.pro_vehi_tax_total || 0),
                parseFloat(r.pro_vehi_sgst_total || 0),
                parseFloat(r.pro_vehi_cgst_total || 0),
                parseFloat(r.pro_vehicle_total || 0),
                `Amount: ${parseFloat(r.pro_missal1_amt || 0).toFixed(2)}`,
                `Amount: ${parseFloat(r.pro_missal2_amt || 0).toFixed(2)}`,
                parseFloat(r.pro_less || 0),
                parseFloat(r.pro_grand_total || 0)
            ]);
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=ProformaPaged_${page}.csv`);
        await workbook.csv.write(res);
        res.end();
    } catch (err) {
        console.error('exportProformaPagedCsv error:', err);
        res.status(500).json({ success: false, message: 'Failed to export paged CSV' });
    }
};

const exportSalesExcel = async (req, res) => {
    let { branchId, from, to, vehicleCode } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });

    try {
        let conditions = ["DATE(tbl_invoice_labour.inv_inv_date) BETWEEN ? AND ?", "(tbl_invoice_labour.inv_type = 'sale' OR tbl_invoice_labour.inv_type = '01')"];
        let params = [from, to];

        if (branchId) {
            conditions.push('tbl_invoice_labour.inv_branch = ?');
            params.push(branchId);
        }

        if (vehicleCode) {
            const codes = Array.isArray(vehicleCode) ? vehicleCode : vehicleCode.split(',').filter(c => c.trim() !== '');
            if (codes.length > 0) {
                const placeholders = codes.map(() => 'LOWER(TRIM(?))').join(',');
                conditions.push(`LOWER(TRIM(tbl_invoice_labour.inv_vehicle_code)) IN (${placeholders})`);
                params.push(...codes.map(c => c.trim().toLowerCase()));
            }
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const query = `SELECT tbl_invoice_labour.*, tbl_branch.branch_name FROM tbl_invoice_labour
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_invoice_labour.inv_branch
             ${where} ORDER BY inv_inv_date DESC`;

        const [rows] = await db.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        worksheet.columns = [
            { header: 'SINO', key: 'sino', width: 8 },
            { header: 'INVOICE NO', key: 'inv_no', width: 20 },
            { header: 'INVOICE DATE', key: 'inv_date', width: 15 },
            { header: 'BRANCH', key: 'branch', width: 25 },
            { header: 'CUSTOMER', key: 'customer', width: 25 },
            { header: 'ADDRESS', key: 'address', width: 35 },
            { header: 'CONTACT NO', key: 'contact', width: 15 },
            { header: 'FATHER/HUS B', key: 'father', width: 20 },
            { header: 'BILL TYPE', key: 'type', width: 12 },
            { header: 'CDMS NO', key: 'cdms', width: 15 },
            { header: 'AREA', key: 'area', width: 20 },
            { header: 'HYPOTHICATIO', key: 'hypo', width: 20 },
            { header: 'CHASSIS NUME', key: 'chassis', width: 25 },
            { header: 'ENGINE NUMB', key: 'engine', width: 25 },
            { header: 'PLACE', key: 'place', width: 20 },
            { header: 'RECEIPT NO', key: 'receipt', width: 15 },
            { header: 'EXECUTIVE', key: 'executive', width: 20 },
            { header: 'FINANCE DUES', key: 'dues', width: 15 },
            { header: 'VEHICLE CODE', key: 'vcode', width: 15 },
            { header: 'VEHICLE NAME', key: 'vname', width: 25 },
            { header: 'COLOR', key: 'color', width: 15 },
            { header: 'TAXAB', key: 'taxable', width: 12 },
            { header: 'SGSTA', key: 'sgst', width: 12 },
            { header: 'CGST', key: 'cgst', width: 12 },
            { header: 'CESS', key: 'cess', width: 12 },
            { header: 'TOTAL', key: 'total', width: 15 },
            { header: 'GSTIN', key: 'gstin', width: 20 }
        ];

        worksheet.getRow(1).font = { bold: true };

        rows.forEach((r, i) => {
            worksheet.addRow({
                sino: i + 1,
                inv_no: r.inv_no,
                inv_date: r.inv_inv_date ? new Date(r.inv_inv_date).toLocaleDateString('en-GB') : '',
                branch: r.branch_name,
                customer: r.inv_cus,
                address: r.inv_cus_addres,
                contact: r.inv_pho,
                father: r.inv_cus_father_hus,
                type: r.inv_type,
                cdms: r.inv_cdms_no,
                area: r.inv_area,
                hypo: r.inv_hypothication,
                chassis: r.inv_chassis,
                engine: r.in_engine,
                place: r.inv_place,
                receipt: r.inv_receipt_no,
                executive: r.inv_advisername,
                dues: r.inv_finance_dues,
                vcode: r.inv_vehicle_code,
                vname: r.inv_vehicle,
                color: r.inv_color,
                taxable: parseFloat(r.inv_taxable_amt || 0),
                sgst: parseFloat(r.inv_sgst || 0),
                cgst: parseFloat(r.inv_cgst || 0),
                cess: parseFloat(r.inv_cess || 0),
                total: parseFloat(r.inv_total || 0),
                gstin: r.inv_gstin
            });
        });

        const totalInvoiceAmount = rows.reduce((acc, r) => acc + (parseFloat(r.inv_total) || 0), 0);

        const footerRow = worksheet.addRow({
            total: totalInvoiceAmount
        });
        footerRow.getCell('total').value = `Total Invoice Amount:-${totalInvoiceAmount.toFixed(2)}`;
        footerRow.font = { bold: true };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=SalesReport_${from}_to_${to}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('exportSalesExcel error:', err);
        res.status(500).json({ success: false, message: 'Failed to export Excel' });
    }
};

const exportSalesPagedExcel = async (req, res) => {
    let { branchId, from, to, vehicleCode } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });

    try {
        let conditions = ["DATE(tbl_invoice_labour.inv_inv_date) BETWEEN ? AND ?", "(tbl_invoice_labour.inv_type = 'sale' OR tbl_invoice_labour.inv_type = '01')"];
        let params = [from, to];

        if (branchId) {
            conditions.push('tbl_invoice_labour.inv_branch = ?');
            params.push(branchId);
        }

        if (vehicleCode) {
            const codes = Array.isArray(vehicleCode) ? vehicleCode : vehicleCode.split(',').filter(c => c.trim() !== '');
            if (codes.length > 0) {
                const placeholders = codes.map(() => 'LOWER(TRIM(?))').join(',');
                conditions.push(`LOWER(TRIM(tbl_invoice_labour.inv_vehicle_code)) IN (${placeholders})`);
                params.push(...codes.map(c => c.trim().toLowerCase()));
            }
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const query = `SELECT tbl_invoice_labour.*, tbl_branch.branch_id, tbl_branch.branch_name FROM tbl_invoice_labour
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_invoice_labour.inv_branch
             ${where} ORDER BY inv_inv_date DESC LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await db.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report Page');

        worksheet.mergeCells('A1:L1');
        const titleRow = worksheet.getRow(1);
        titleRow.getCell(1).value = 'Sales Bill Statement';
        titleRow.getCell(1).alignment = { horizontal: 'center' };
        titleRow.getCell(1).font = { bold: true };

        worksheet.getRow(2).values = [
            'INVOICE NO', 'DATE', 'BRANCH', 'VEHICLE', 'VEHICLE CODE', 'CUSTOMER', 'ADDRESS', 'CONTACT', 'FATHER', 'INVOICE TYPE', 'CDMS', 'AREA', 'HYPO', 'CHASSIS', 'ENGINE', 'EXECUTIVE', 'COLOR', 'TAXABLE', 'SGST', 'CGST', 'CESS', 'TOTAL'
        ];
        worksheet.getRow(2).font = { bold: true };

        rows.forEach((r) => {
            worksheet.addRow([
                r.inv_no,
                r.inv_inv_date ? new Date(r.inv_inv_date).toLocaleDateString('en-GB') : '',
                r.branch_name + '(' + r.branch_id + ')',
                r.inv_vehicle,
                r.inv_vehicle_code,
                r.inv_cus,
                r.inv_cus_addres,
                r.inv_pho,
                r.inv_cus_father_hus,
                r.inv_type,
                r.inv_cdms_no,
                r.inv_area,
                r.inv_hypothication,
                r.inv_chassis,
                r.in_engine,
                r.inv_advisername,
                r.inv_color,
                parseFloat(r.inv_taxable_amt || 0),
                parseFloat(r.inv_sgst || 0),
                parseFloat(r.inv_cgst || 0),
                parseFloat(r.inv_cess || 0),
                parseFloat(r.inv_total || 0)
            ]);
        });

        worksheet.columns.forEach(col => { col.width = 20; });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=SalesPaged_${page}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('exportSalesPagedExcel error:', err);
        res.status(500).json({ success: false, message: 'Failed to export paged Excel' });
    }
};

const exportSalesPagedCsv = async (req, res) => {
    let { branchId, from, to, vehicleCode } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });

    try {
        let conditions = ["DATE(tbl_invoice_labour.inv_inv_date) BETWEEN ? AND ?", "(tbl_invoice_labour.inv_type = 'sale' OR tbl_invoice_labour.inv_type = '01')"];
        let params = [from, to];

        if (branchId) {
            conditions.push('tbl_invoice_labour.inv_branch = ?');
            params.push(branchId);
        }

        if (vehicleCode) {
            const codes = Array.isArray(vehicleCode) ? vehicleCode : vehicleCode.split(',').filter(c => c.trim() !== '');
            if (codes.length > 0) {
                const placeholders = codes.map(() => 'LOWER(TRIM(?))').join(',');
                conditions.push(`LOWER(TRIM(tbl_invoice_labour.inv_vehicle_code)) IN (${placeholders})`);
                params.push(...codes.map(c => c.trim().toLowerCase()));
            }
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const query = `SELECT tbl_invoice_labour.*, tbl_branch.branch_id, tbl_branch.branch_name FROM tbl_invoice_labour
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_invoice_labour.inv_branch
             ${where} ORDER BY inv_inv_date DESC LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await db.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report Page');

        worksheet.addRow([
            'INVOICE NO', 'DATE', 'BRANCH', 'VEHICLE', 'VEHICLE CODE', 'CUSTOMER', 'ADDRESS', 'CONTACT', 'FATHER', 'INVOICE TYPE', 'CDMS', 'AREA', 'HYPO', 'CHASSIS', 'ENGINE', 'EXECUTIVE', 'COLOR', 'TAXABLE', 'SGST', 'CGST', 'CESS', 'TOTAL'
        ]);

        rows.forEach((r) => {
            worksheet.addRow([
                r.inv_no,
                r.inv_inv_date ? new Date(r.inv_inv_date).toISOString().split('T')[0] : '',
                r.branch_name + '(' + r.branch_id + ')',
                r.inv_vehicle,
                r.inv_vehicle_code,
                r.inv_cus,
                r.inv_cus_addres,
                r.inv_pho,
                r.inv_cus_father_hus,
                r.inv_type,
                r.inv_cdms_no,
                r.inv_area,
                r.inv_hypothication,
                r.inv_chassis,
                r.in_engine,
                r.inv_advisername,
                r.inv_color,
                parseFloat(r.inv_taxable_amt || 0),
                parseFloat(r.inv_sgst || 0),
                parseFloat(r.inv_cgst || 0),
                parseFloat(r.inv_cess || 0),
                parseFloat(r.inv_total || 0)
            ]);
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=SalesPaged_${page}.csv`);
        await workbook.csv.write(res);
        res.end();
    } catch (err) {
        console.error('exportSalesPagedCsv error:', err);
        res.status(500).json({ success: false, message: 'Failed to export paged CSV' });
    }
};

const exportPurchaseExcel = async (req, res) => {
    let { branchId, from, to, vehicleCode } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });

    try {
        let conditions = ["DATE(pb.rac_date) BETWEEN ? AND ?"];
        let params = [from, to];

        if (branchId) {
            conditions.push('pb.purch_branchId = ?');
            params.push(branchId);
        }

        if (vehicleCode) {
            const codes = Array.isArray(vehicleCode) ? vehicleCode : vehicleCode.split(',').filter(c => c.trim() !== '');
            if (codes.length > 0) {
                const placeholders = codes.map(() => 'LOWER(TRIM(?))').join(',');
                conditions.push(`LOWER(TRIM(pi.materialsId)) IN (${placeholders})`);
                params.push(...codes.map(c => c.trim().toLowerCase()));
            }
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const query = `SELECT 
                pb.invoiceNo, 
                pb.rac_date, 
                b.branch_name, 
                b.branch_id,
                pb.pucha_vendorName, 
                pb.purcha_vend_addrs,
                pi.materialsId,
                pi.materialName,
                pb.invoiceDate, 
                pi.chassis_no, 
                pi.engine_no, 
                pi.color_name, 
                pb.total_bill_amount
             FROM purchaseitembill pb
             LEFT JOIN purchaseitem pi ON pi.purchaseItemBillId = pb.purchaseItemBillId
             LEFT JOIN tbl_branch b ON b.b_id = pb.purch_branchId
             ${where} ORDER BY pb.rac_date`;

        const [rows] = await db.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Purchase Report');

        worksheet.columns = [
            { header: 'SI:NO', key: 'sino', width: 8 },
            { header: 'INVOICE NO', key: 'inv_no', width: 20 },
            { header: 'RC DATE', key: 'rc_date', width: 15 },
            { header: 'BRANCH', key: 'branch', width: 25 },
            { header: 'Product Name', key: 'pname', width: 25 },
            { header: 'VENDOR NAME', key: 'vname', width: 25 },
            { header: 'ADDRESS', key: 'address', width: 40 },
            { header: 'VEHICLE CODE', key: 'vcode', width: 20 },
            { header: 'Invoice DATE', key: 'inv_date', width: 20 },
            { header: 'CHASSIS NO', key: 'chassis', width: 25 },
            { header: 'ENGINE NO', key: 'engine', width: 25 },
            { header: 'COLOR', key: 'color', width: 15 },
            { header: 'AMOUNT', key: 'amount', width: 15 }
        ];

        worksheet.getRow(1).font = { bold: true };

        rows.forEach((r, i) => {
            worksheet.addRow({
                sino: i + 1,
                inv_no: r.invoiceNo,
                rc_date: r.rac_date ? new Date(r.rac_date).toLocaleDateString('en-GB') : '',
                branch: r.branch_name,
                pname: r.materialName,
                vname: r.pucha_vendorName,
                address: r.purcha_vend_addrs,
                vcode: r.materialsId,
                inv_date: r.invoiceDate ? new Date(r.invoiceDate).toLocaleDateString('en-GB') : '',
                chassis: r.chassis_no,
                engine: r.engine_no,
                color: r.color_name,
                amount: parseFloat(r.total_bill_amount || 0)
            });
        });

        const totalAmount = rows.reduce((acc, r) => acc + (parseFloat(r.total_bill_amount) || 0), 0);
        const footerRow = worksheet.addRow({ amount: totalAmount });
        footerRow.getCell('amount').value = `Total Invoice Amount:-${totalAmount.toFixed(2)}/–`;
        footerRow.font = { bold: true };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=PurchaseReport_${from}_to_${to}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('exportPurchaseExcel error:', err);
        res.status(500).json({ success: false, message: 'Failed to export Excel' });
    }
};

const exportPurchasePagedExcel = async (req, res) => {
    let { branchId, from, to, vehicleCode } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });

    try {
        let conditions = ["DATE(pb.rac_date) BETWEEN ? AND ?"];
        let params = [from, to];

        if (branchId) {
            conditions.push('pb.purch_branchId = ?');
            params.push(branchId);
        }

        if (vehicleCode) {
            const codes = Array.isArray(vehicleCode) ? vehicleCode : vehicleCode.split(',').filter(c => c.trim() !== '');
            if (codes.length > 0) {
                const placeholders = codes.map(() => 'LOWER(TRIM(?))').join(',');
                conditions.push(`LOWER(TRIM(pi.materialsId)) IN (${placeholders})`);
                params.push(...codes.map(c => c.trim().toLowerCase()));
            }
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const query = `SELECT 
                pb.invoiceNo, 
                pb.rac_date, 
                b.branch_name, 
                b.branch_id,
                pb.pucha_vendorName, 
                pi.materialName,
                pi.materialsId,
                pb.invoiceDate, 
                pi.chassis_no, 
                pi.engine_no, 
                pi.color_name, 
                pb.total_bill_amount
             FROM purchaseitembill pb
             LEFT JOIN purchaseitem pi ON pi.purchaseItemBillId = pb.purchaseItemBillId
             LEFT JOIN tbl_branch b ON b.b_id = pb.purch_branchId
             ${where} ORDER BY pb.rac_date LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await db.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Purchase Report Page');

        worksheet.mergeCells('A1:L1');
        const titleRow = worksheet.getRow(1);
        titleRow.getCell(1).value = 'Purchase Bill Statement';
        titleRow.getCell(1).alignment = { horizontal: 'center' };
        titleRow.getCell(1).font = { bold: true };

        worksheet.getRow(2).values = [
            'INVOICE NO', 'DATE', 'BRANCH', 'VEHICLE', 'VEHICLE CODE', 'VENDOR NAME', 'Vehicle Invoice DATE', 'CHASSIS NO', 'ENGINE NO', 'COLOR', 'AMOUNT'
        ];
        worksheet.getRow(2).font = { bold: true };

        rows.forEach((r) => {
            worksheet.addRow([
                r.invoiceNo,
                r.rac_date ? new Date(r.rac_date).toLocaleDateString('en-GB') : '',
                `${r.branch_name} (${r.branch_id})`,
                r.materialName,
                r.materialsId,
                r.pucha_vendorName,
                r.invoiceDate ? new Date(r.invoiceDate).toLocaleDateString('en-GB') : '',
                r.chassis_no,
                r.engine_no,
                r.color_name,
                parseFloat(r.total_bill_amount || 0)
            ]);
        });

        worksheet.columns.forEach(col => { col.width = 20; });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=PurchasePaged_${page}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('exportPurchasePagedExcel error:', err);
        res.status(500).json({ success: false, message: 'Failed to export paged Excel' });
    }
};

const exportPurchasePagedCsv = async (req, res) => {
    let { branchId, from, to, vehicleCode } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });

    try {
        let conditions = ["DATE(pb.rac_date) BETWEEN ? AND ?"];
        let params = [from, to];

        if (branchId) {
            conditions.push('pb.purch_branchId = ?');
            params.push(branchId);
        }

        if (vehicleCode) {
            const codes = Array.isArray(vehicleCode) ? vehicleCode : vehicleCode.split(',').filter(c => c.trim() !== '');
            if (codes.length > 0) {
                const placeholders = codes.map(() => 'LOWER(TRIM(?))').join(',');
                conditions.push(`LOWER(TRIM(pi.materialsId)) IN (${placeholders})`);
                params.push(...codes.map(c => c.trim().toLowerCase()));
            }
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const query = `SELECT 
                pb.invoiceNo, 
                pb.rac_date, 
                b.branch_name, 
                b.branch_id,
                pb.pucha_vendorName, 
                pi.materialName,
                pi.materialsId,
                pb.invoiceDate, 
                pi.chassis_no, 
                pi.engine_no, 
                pi.color_name, 
                pb.total_bill_amount
             FROM purchaseitembill pb
             LEFT JOIN purchaseitem pi ON pi.purchaseItemBillId = pb.purchaseItemBillId
             LEFT JOIN tbl_branch b ON b.b_id = pb.purch_branchId
             ${where} ORDER BY pb.rac_date LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await db.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Purchase Report Page');

        worksheet.addRow([
            'INVOICE NO', 'DATE', 'BRANCH', 'VEHICLE', 'VEHICLE CODE', 'VENDOR NAME', 'Vehicle Invoice DATE', 'CHASSIS NO', 'ENGINE NO', 'COLOR', 'AMOUNT'
        ]);

        rows.forEach((r) => {
            worksheet.addRow([
                r.invoiceNo,
                r.rac_date ? new Date(r.rac_date).toLocaleDateString('en-GB') : '',
                `${r.branch_name} (${r.branch_id})`,
                r.materialName,
                r.materialsId,
                r.pucha_vendorName,
                r.invoiceDate ? new Date(r.invoiceDate).toLocaleDateString('en-GB') : '',
                r.chassis_no,
                r.engine_no,
                r.color_name,
                parseFloat(r.total_bill_amount || 0)
            ]);
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=PurchasePaged_${page}.csv`);
        await workbook.csv.write(res);
        res.end();
    } catch (err) {
        console.error('exportPurchasePagedCsv error:', err);
        res.status(500).json({ success: false, message: 'Failed to export paged CSV' });
    }
};

const exportPayslipExcel = async (req, res) => {
    let { branchId, from, to } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });

    try {
        let conditions = ["DATE(pay_slip_date) BETWEEN ? AND ?"];
        let params = [from, to];

        if (branchId) {
            conditions.push('tbl_payslip.pay_branch_id = ?');
            params.push(branchId);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const query = `SELECT tbl_payslip.*, tbl_branch.branch_name FROM tbl_payslip
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_payslip.pay_branch_id
             ${where} ORDER BY pay_slip_date DESC`;

        const [rows] = await db.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Payslip Report');

        worksheet.columns = [
            { header: 'SI:NO', key: 'sino', width: 8 },
            { header: 'PAYSLIP NO', key: 'pay_slip_no', width: 20 },
            { header: 'PAYSLIP DATE', key: 'pay_slip_date', width: 15 },
            { header: 'BRANCH', key: 'branch_name', width: 25 },
            { header: 'CUSTOMER', key: 'pay_cus_name', width: 25 },
            { header: 'VEHICLE', key: 'pay_slip_reference', width: 30 },
            { header: 'VEHICLE TYPE', key: 'pay_vehil_type', width: 15 },
            { header: 'EXECUTIVE', key: 'pay_regn', width: 20 },
            { header: 'REMARKS', key: 'pay_remarks', width: 30 },
            { header: 'EARNINGS', key: 'pay_add_total', width: 15 },
            { header: 'DEDUCTIONS', key: 'pay_less_total', width: 15 },
            { header: 'BALANCE AMOUNT', key: 'pay_grand_tot', width: 15 }
        ];

        worksheet.getRow(1).font = { bold: true };

        rows.forEach((r, i) => {
            worksheet.addRow({
                sino: i + 1,
                pay_slip_no: r.pay_slip_no,
                pay_slip_date: r.pay_slip_date ? new Date(r.pay_slip_date).toLocaleDateString('en-GB') : '',
                branch_name: r.branch_name,
                pay_cus_name: r.pay_cus_name,
                pay_slip_reference: r.pay_slip_reference,
                pay_vehil_type: r.pay_vehil_type,
                pay_regn: r.pay_regn,
                pay_remarks: r.pay_remarks,
                pay_add_total: parseFloat(r.pay_add_total || 0),
                pay_less_total: parseFloat(r.pay_less_total || 0),
                pay_grand_tot: parseFloat(r.pay_grand_tot || 0)
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=PayslipReport_${from}_to_${to}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('exportPayslipExcel error:', err);
        res.status(500).json({ success: false, message: 'Failed to export Excel' });
    }
};

const exportPayslipPagedExcel = async (req, res) => {
    let { branchId, from, to } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });

    try {
        let conditions = ["DATE(pay_slip_date) BETWEEN ? AND ?"];
        let params = [from, to];

        if (branchId) {
            conditions.push('tbl_payslip.pay_branch_id = ?');
            params.push(branchId);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const query = `SELECT tbl_payslip.*, tbl_branch.branch_name, tbl_branch.branch_id FROM tbl_payslip
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_payslip.pay_branch_id
             ${where} ORDER BY pay_slip_date DESC LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await db.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Payslip Report Page');

        worksheet.mergeCells('A1:J1');
        const titleRow = worksheet.getRow(1);
        titleRow.getCell(1).value = 'Payslip Report';
        titleRow.getCell(1).alignment = { horizontal: 'center' };
        titleRow.getCell(1).font = { bold: true };

        worksheet.getRow(2).values = [
            'PAYSLIP NO', 'DATE', 'BRANCH', 'VEHICLE', 'CUSTOMER', 'EXECUTIVE', 'VEHICLE TYPE', 'EARNINGS', 'DEDUCTIONS', 'BALANCE TOTAL'
        ];
        worksheet.getRow(2).font = { bold: true };

        rows.forEach((r) => {
            worksheet.addRow([
                r.pay_slip_no,
                r.pay_slip_date ? new Date(r.pay_slip_date).toLocaleDateString('en-GB') : '',
                `${r.branch_name} (${r.branch_id})`,
                r.pay_slip_reference,
                r.pay_cus_name,
                r.pay_regn,
                r.pay_vehil_type,
                parseFloat(r.pay_add_total || 0).toFixed(2),
                parseFloat(r.pay_less_total || 0).toFixed(2),
                parseFloat(r.pay_grand_tot || 0).toFixed(2)
            ]);
        });

        worksheet.columns.forEach(col => { col.width = 20; });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=PayslipPaged_${page}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('exportPayslipPagedExcel error:', err);
        res.status(500).json({ success: false, message: 'Failed to export paged Excel' });
    }
};

const exportPayslipPagedCsv = async (req, res) => {
    let { branchId, from, to } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });

    try {
        let conditions = ["DATE(pay_slip_date) BETWEEN ? AND ?"];
        let params = [from, to];

        if (branchId) {
            conditions.push('tbl_payslip.pay_branch_id = ?');
            params.push(branchId);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const query = `SELECT tbl_payslip.*, tbl_branch.branch_name, tbl_branch.branch_id FROM tbl_payslip
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_payslip.pay_branch_id
             ${where} ORDER BY pay_slip_date DESC LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await db.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Payslip Report Page');

        worksheet.addRow([
            'PAYSLIP NO', 'DATE', 'BRANCH', 'VEHICLE', 'CUSTOMER', 'EXECUTIVE', 'VEHICLE TYPE', 'EARNINGS', 'DEDUCTIONS', 'BALANCE TOTAL'
        ]);

        rows.forEach((r) => {
            worksheet.addRow([
                r.pay_slip_no,
                r.pay_slip_date ? new Date(r.pay_slip_date).toLocaleDateString('en-GB') : '',
                `${r.branch_name} (${r.branch_id})`,
                r.pay_slip_reference,
                r.pay_cus_name,
                r.pay_regn,
                r.pay_vehil_type,
                parseFloat(r.pay_add_total || 0).toFixed(2),
                parseFloat(r.pay_less_total || 0).toFixed(2),
                parseFloat(r.pay_grand_tot || 0).toFixed(2)
            ]);
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=PayslipPaged_${page}.csv`);
        await workbook.csv.write(res);
        res.end();
    } catch (err) {
        console.error('exportPayslipPagedCsv error:', err);
        res.status(500).json({ success: false, message: 'Failed to export paged CSV' });
    }
};

const exportMoneyReceiptExcel = async (req, res) => {
    let { branchId, from, to } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });

    try {
        let conditions = ["DATE(receipt_date) BETWEEN ? AND ?"];
        let params = [from, to];

        if (branchId) {
            conditions.push('tbl_money_receipt.rec_branch_id = ?');
            params.push(branchId);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const query = `SELECT tbl_money_receipt.*, tbl_branch.branch_name FROM tbl_money_receipt
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_money_receipt.rec_branch_id
             ${where} ORDER BY receipt_date DESC`;

        const [rows] = await db.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Money Receipt Report');

        worksheet.columns = [
            { header: 'SI:NO', key: 'sino', width: 8 },
            { header: 'RECEIPT NO', key: 'receipt_no', width: 20 },
            { header: 'DATE', key: 'receipt_date', width: 15 },
            { header: 'BRANCH', key: 'branch_name', width: 25 },
            { header: 'REFERENCE', key: 'reference', width: 25 },
            { header: 'REASON', key: 'reason', width: 30 },
            { header: 'PAY TYPE', key: 'pay_type', width: 15 },
            { header: 'CHEQUE DATE', key: 'cheque_dd_date', width: 15 },
            { header: 'CHEQUE NO', key: 'cheque_dd_po_no', width: 20 },
            { header: 'CUSTOMER', key: 'receipt_cus', width: 25 },
            { header: 'ADDRESS', key: 'receipt_cus_address', width: 40 },
            { header: 'AMOUNT', key: 'receipt_amount', width: 15 },
            { header: 'BANK NAME', key: 'bank_name', width: 20 },
            { header: 'BANK PLACE', key: 'bank_place', width: 20 },
            { header: 'REFUND STATUS', key: 'refund_status', width: 15 }
        ];

        worksheet.getRow(1).font = { bold: true };

        rows.forEach((r, i) => {
            worksheet.addRow({
                sino: i + 1,
                receipt_no: r.receipt_no,
                receipt_date: r.receipt_date ? new Date(r.receipt_date).toLocaleDateString('en-GB') : '',
                branch_name: r.branch_name,
                reference: r.reference,
                reason: r.reason,
                pay_type: r.pay_type,
                cheque_dd_date: r.cheque_dd_date ? new Date(r.cheque_dd_date).toLocaleDateString('en-GB') : '',
                cheque_dd_po_no: r.cheque_dd_po_no,
                receipt_cus: r.receipt_cus,
                receipt_cus_address: r.receipt_cus_address,
                receipt_amount: parseFloat(r.receipt_amount || 0),
                bank_name: r.bank_name,
                bank_place: r.bank_place,
                refund_status: r.refund_status
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=MoneyReceiptReport_${from}_to_${to}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('exportMoneyReceiptExcel error:', err);
        res.status(500).json({ success: false, message: 'Failed to export Excel' });
    }
};

const exportMoneyReceiptPagedExcel = async (req, res) => {
    let { branchId, from, to } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });

    try {
        let conditions = ["DATE(receipt_date) BETWEEN ? AND ?"];
        let params = [from, to];

        if (branchId) {
            conditions.push('tbl_money_receipt.rec_branch_id = ?');
            params.push(branchId);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const query = `SELECT tbl_money_receipt.*, tbl_branch.branch_name FROM tbl_money_receipt
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_money_receipt.rec_branch_id
             ${where} ORDER BY receipt_date DESC LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await db.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Money Receipt Report Page');

        worksheet.mergeCells('A1:N1');
        const titleRow = worksheet.getRow(1);
        titleRow.getCell(1).value = 'Money Receipt Report';
        titleRow.getCell(1).alignment = { horizontal: 'center' };
        titleRow.getCell(1).font = { bold: true };

        worksheet.getRow(2).values = [
            'RECEIPT NO', 'DATE', 'BRANCH', 'REFERENCE', 'REASON', 'PAY TYPE', 'CHEQUE DATE', 'CHEQUE NO', 'CUSTOMER', 'ADDRESS', 'AMOUNT', 'BANK NAME', 'BANK PLACE', 'REFUND STATUS'
        ];
        worksheet.getRow(2).font = { bold: true };

        rows.forEach((r) => {
            worksheet.addRow([
                r.receipt_no,
                r.receipt_date ? new Date(r.receipt_date).toLocaleDateString('en-GB') : '',
                r.branch_name,
                r.reference,
                r.reason,
                r.pay_type,
                r.cheque_dd_date ? new Date(r.cheque_dd_date).toLocaleDateString('en-GB') : '',
                r.cheque_dd_po_no,
                r.receipt_cus,
                r.receipt_cus_address,
                parseFloat(r.receipt_amount || 0).toFixed(2),
                r.bank_name,
                r.bank_place,
                r.refund_status
            ]);
        });

        worksheet.columns.forEach(col => { col.width = 20; });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=MoneyReceiptPaged_${page}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('exportMoneyReceiptPagedExcel error:', err);
        res.status(500).json({ success: false, message: 'Failed to export paged Excel' });
    }
};

const exportMoneyReceiptPagedCsv = async (req, res) => {
    let { branchId, from, to } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });

    try {
        let conditions = ["DATE(receipt_date) BETWEEN ? AND ?"];
        let params = [from, to];

        if (branchId) {
            conditions.push('tbl_money_receipt.rec_branch_id = ?');
            params.push(branchId);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const query = `SELECT tbl_money_receipt.*, tbl_branch.branch_name FROM tbl_money_receipt
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_money_receipt.rec_branch_id
             ${where} ORDER BY receipt_date DESC LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await db.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Money Receipt Report Page');

        worksheet.addRow([
            'RECEIPT NO', 'DATE', 'BRANCH', 'REFERENCE', 'REASON', 'PAY TYPE', 'CHEQUE DATE', 'CHEQUE NO', 'CUSTOMER', 'ADDRESS', 'AMOUNT', 'BANK NAME', 'BANK PLACE', 'REFUND STATUS'
        ]);

        rows.forEach((r) => {
            worksheet.addRow([
                r.receipt_no,
                r.receipt_date ? new Date(r.receipt_date).toLocaleDateString('en-GB') : '',
                r.branch_name,
                r.reference,
                r.reason,
                r.pay_type,
                r.cheque_dd_date ? new Date(r.cheque_dd_date).toLocaleDateString('en-GB') : '',
                r.cheque_dd_po_no,
                r.receipt_cus,
                r.receipt_cus_address,
                parseFloat(r.receipt_amount || 0).toFixed(2),
                r.bank_name,
                r.bank_place,
                r.refund_status
            ]);
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=MoneyReceiptPaged_${page}.csv`);
        await workbook.csv.write(res);
        res.end();
    } catch (err) {
        console.error('exportMoneyReceiptPagedCsv error:', err);
        res.status(500).json({ success: false, message: 'Failed to export paged CSV' });
    }
};

const exportBranchTransferExcel = async (req, res) => {
    let { branchId, from, to } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });

    try {
        let conditions = ["DATE(debit_note_date) BETWEEN ? AND ?"];
        let params = [from, to];

        if (branchId) {
            conditions.push('tbl_branch_transfer.ic_branch = ?');
            params.push(branchId);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const query = `SELECT tbl_branch_transfer.*, b1.branch_name as from_branch_name, b1.branch_id as from_branch_id, 
                    b2.branch_name as to_branch_name, b2.branch_address as to_branch_address
             FROM tbl_branch_transfer
             LEFT JOIN tbl_branch b1 ON b1.b_id = tbl_branch_transfer.ic_branch
             LEFT JOIN tbl_branch b2 ON b2.b_id = tbl_branch_transfer.lnstitute_branch_id
             ${where} ORDER BY debit_note_date DESC`;

        const [rows] = await db.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Branch Transfer Report');

        worksheet.columns = [
            { header: 'SI:NO', key: 'sino', width: 8 },
            { header: 'CREDIT NOTE NO', key: 'debit_note_no', width: 20 },
            { header: 'CREDIT NOTE DATE', key: 'debit_note_date', width: 15 },
            { header: 'FROM BRANCH', key: 'from_branch_name', width: 25 },
            { header: 'ISSUE TO BRANCH', key: 'to_branch_name', width: 25 },
            { header: 'ADDRESS', key: 'to_branch_address', width: 40 },
            { header: 'ISSUE TYPE', key: 'issue_type', width: 15 },
            { header: 'CHASSIS NO', key: 'chassis_no', width: 20 },
            { header: 'ENGINE NO', key: 'engine_no', width: 20 },
            { header: 'VEHICLE', key: 'vehicle', width: 20 },
            { header: 'CODE', key: 'vehicle_code', width: 15 },
            { header: 'COLOR', key: 'vehicle_color', width: 15 },
            { header: 'AMOUNT', key: 'trans_total', width: 15 }
        ];

        worksheet.getRow(1).font = { bold: true };

        let totalAmount = 0;
        rows.forEach((r, i) => {
            const amount = parseFloat(r.trans_total || 0);
            totalAmount += amount;
            worksheet.addRow({
                sino: i + 1,
                debit_note_no: r.debit_note_no,
                debit_note_date: r.debit_note_date ? new Date(r.debit_note_date).toLocaleDateString('en-GB') : '',
                from_branch_name: r.from_branch_name,
                to_branch_name: r.to_branch_name || r.lnstitute_name,
                to_branch_address: r.to_branch_address,
                issue_type: r.issue_type,
                chassis_no: r.chassis_no,
                engine_no: r.engine_no,
                vehicle: r.vehicle,
                vehicle_code: r.vehicle_code,
                vehicle_color: r.vehicle_color,
                trans_total: amount
            });
        });

        // const totalRow = worksheet.addRow({ trans_total: totalAmount });
        // totalRow.getCell('trans_total').font = { bold: true };
        worksheet.addRow({ vehicle_color: 'Total Invoice Amount:-', trans_total: totalAmount }).font = { bold: true };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=BranchTransferReport_${from}_to_${to}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('exportBranchTransferExcel error:', err);
        res.status(500).json({ success: false, message: 'Failed to export Excel' });
    }
};

const exportBranchTransferPagedExcel = async (req, res) => {
    let { branchId, from, to } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });

    try {
        let conditions = ["DATE(debit_note_date) BETWEEN ? AND ?"];
        let params = [from, to];

        if (branchId) {
            conditions.push('tbl_branch_transfer.ic_branch = ?');
            params.push(branchId);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const query = `SELECT tbl_branch_transfer.*, b1.branch_name as from_branch_name, b1.branch_id as from_branch_id, 
                    b2.branch_name as to_branch_name, b2.branch_address as to_branch_address
             FROM tbl_branch_transfer
             LEFT JOIN tbl_branch b1 ON b1.b_id = tbl_branch_transfer.ic_branch
             LEFT JOIN tbl_branch b2 ON b2.b_id = tbl_branch_transfer.lnstitute_branch_id
             ${where} ORDER BY debit_note_date DESC LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await db.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Branch Transfer Page');

        worksheet.mergeCells('A1:J1');
        const titleRow = worksheet.getRow(1);
        titleRow.getCell(1).value = 'Branch Transfer Report';
        titleRow.getCell(1).alignment = { horizontal: 'center' };
        titleRow.getCell(1).font = { bold: true };

        worksheet.getRow(2).values = [
            'CREDIT NOTE NO', 'DATE', 'FROM BRANCH', 'ISSUE TO BRANCH', 'ADDRESS', 'CHASSIS NO', 'ENGINE NO', 'VEHICLE', 'COLOR', 'AMOUNT'
        ];
        worksheet.getRow(2).font = { bold: true };

        rows.forEach((r) => {
            worksheet.addRow([
                r.debit_note_no,
                r.debit_note_date ? new Date(r.debit_note_date).toLocaleDateString('en-GB') : '',
                `${r.from_branch_name} (${r.from_branch_id})`,
                r.to_branch_name || r.lnstitute_name,
                r.to_branch_address,
                r.chassis_no,
                r.engine_no,
                `${r.vehicle} (${r.vehicle_code})`,
                r.vehicle_color,
                parseFloat(r.trans_total || 0).toFixed(2)
            ]);
        });

        worksheet.columns.forEach(col => { col.width = 20; });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=BranchTransferPaged_${page}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('exportBranchTransferPagedExcel error:', err);
        res.status(500).json({ success: false, message: 'Failed to export paged Excel' });
    }
};

const exportBranchTransferPagedCsv = async (req, res) => {
    let { branchId, from, to } = req.query;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });

    try {
        let conditions = ["DATE(debit_note_date) BETWEEN ? AND ?"];
        let params = [from, to];

        if (branchId) {
            conditions.push('tbl_branch_transfer.ic_branch = ?');
            params.push(branchId);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const query = `SELECT tbl_branch_transfer.*, b1.branch_name as from_branch_name, b1.branch_id as from_branch_id, 
                    b2.branch_name as to_branch_name, b2.branch_address as to_branch_address
             FROM tbl_branch_transfer
             LEFT JOIN tbl_branch b1 ON b1.b_id = tbl_branch_transfer.ic_branch
             LEFT JOIN tbl_branch b2 ON b2.b_id = tbl_branch_transfer.lnstitute_branch_id
             ${where} ORDER BY debit_note_date DESC LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await db.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Branch Transfer Page');

        worksheet.addRow([
            'CREDIT NOTE NO', 'DATE', 'FROM BRANCH', 'ISSUE TO BRANCH', 'ADDRESS', 'CHASSIS NO', 'ENGINE NO', 'VEHICLE', 'COLOR', 'AMOUNT'
        ]);

        rows.forEach((r) => {
            worksheet.addRow([
                r.debit_note_no,
                r.debit_note_date ? new Date(r.debit_note_date).toLocaleDateString('en-GB') : '',
                `${r.from_branch_name} (${r.from_branch_id})`,
                r.to_branch_name || r.lnstitute_name,
                r.to_branch_address,
                r.chassis_no,
                r.engine_no,
                `${r.vehicle} (${r.vehicle_code})`,
                r.vehicle_color,
                parseFloat(r.trans_total || 0).toFixed(2)
            ]);
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=BranchTransferPaged_${page}.csv`);
        await workbook.csv.write(res);
        res.end();
    } catch (err) {
        console.error('exportBranchTransferPagedCsv error:', err);
        res.status(500).json({ success: false, message: 'Failed to export paged CSV' });
    }
};

module.exports = {
    getSalesReport, getPurchaseReport, getMoneyReceiptReport, getPaySlipReport,
    getBranchTransferReport, getProformaReport, getVsiReport,
    exportProformaExcel, exportProformaPagedExcel, exportProformaPagedCsv,
    exportSalesExcel, exportSalesPagedExcel, exportSalesPagedCsv,
    exportPurchaseExcel, exportPurchasePagedExcel, exportPurchasePagedCsv,
    exportPayslipExcel, exportPayslipPagedExcel, exportPayslipPagedCsv,
    exportMoneyReceiptExcel, exportMoneyReceiptPagedExcel, exportMoneyReceiptPagedCsv,
    exportBranchTransferExcel, exportBranchTransferPagedExcel, exportBranchTransferPagedCsv
};
