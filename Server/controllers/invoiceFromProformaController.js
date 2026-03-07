const db = require('../config/db');

const getAvailableChassisRecords = async (req, res) => {
    let branchId = req.query.branchId || null;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
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

        sql += ' ORDER BY pi.purchaseItemId DESC';
        const [rows] = params.length ? await db.execute(sql, params) : await db.execute(sql);

        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getAvailableChassisRecords error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch available chassis records' });
    }
};

const getNextInvoiceFromProformaNumber = async (req, res) => {
    let branchId = req.query.branchId;
    if (req.user && req.user.role == 2) {
        branchId = req.user.branch_id;
    }
    console.log({ branchId }, `branchId from invoice from proforma`);

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


const getInvoiceFromProformaExecutives = async (req, res) => {
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
    getAvailableChassisRecords,
    getNextInvoiceFromProformaNumber,
    getInvoiceFromProformaExecutives
};
