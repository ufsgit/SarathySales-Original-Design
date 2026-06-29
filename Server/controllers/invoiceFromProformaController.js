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
                tlc.labour_code AS labour_code,
                tlc.sale_price AS basic_amount,
                0 AS discount_amount,
                0 AS taxable_amount,
                tlc.sgst AS labour_sgst,
                tlc.cgst AS labour_cgst,
                tlc.cess AS labour_cess,
                0 AS inv_total,
                pb.purch_branchId AS inv_branch,
                pb.pucha_vendorName AS inv_cus,
                til.inv_no,
                til.inv_id,
                tlc.id_tax_slab AS id_tax_slab
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

        // Attach labour data fields directly so frontend can do Auto tax without extra API call
        const data = rows.map(r => ({
            ...r,
            labour_sale_price: r.basic_amount ?? 0,
            labour_cgst: r.labour_cgst ?? 0,
            labour_sgst: r.labour_sgst ?? 0,
            labour_cess: r.labour_cess ?? 0,
            id_tax_slab: r.id_tax_slab
        }));

        res.json({ success: true, data });
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

        // 🔹 Fetch branch_id from tbl_branch
        const [branchRows] = await db.execute(
            `SELECT branch_id FROM tbl_branch WHERE b_id = ?`,
            [branchId]
        );

        let brand_id = branchId;
        if (branchRows.length > 0 && branchRows[0].branch_id) {
            brand_id = branchRows[0].branch_id;
        }

        const prefix = `VSI${currentYear}${brand_id}`;

        // 🔹 Fetch last invoice matching the new prefix
        const [rows] = await db.execute(
            `
            SELECT inv_no
            FROM tbl_invoice_labour
            WHERE inv_branch = ?
              AND inv_no LIKE ?
            ORDER BY inv_id DESC
            LIMIT 1
            `,
            [branchId, `${prefix}%`]
        );

        let nextRunningNumber = 1;
        let padLength = 6; // Default standard length

        if (rows.length > 0 && rows[0].inv_no) {
            const lastInvoiceNo = rows[0].inv_no;

            // Dynamically strip the prefix to get the pure serial number
            const serialStr = lastInvoiceNo.substring(prefix.length);
            const lastNumber = parseInt(serialStr, 10);
            
            if (!isNaN(lastNumber)) {
                nextRunningNumber = lastNumber + 1;
                // Measure the length of the existing serial to maintain formatting
                padLength = serialStr.length > 0 ? serialStr.length : 6;
            }
        }

        const formattedRunningNumber = nextRunningNumber
            .toString()
            .padStart(padLength, '0');

        const newInvoiceNumber = `${prefix}${formattedRunningNumber}`;

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
    const branchId = req.query.branchId;
    const branchName = req.query.branchName;
    try {
        let rows = [];
        if (branchId) {
            [rows] = await db.execute(
                `SELECT emp_id, e_first_name FROM tbl_employee
                 WHERE (e_branch = ? OR e_branch = ?)
                   AND e_designation = 'Executive'
                 ORDER BY e_first_name`, [branchId, branchName || branchId]
            );
        } else if (branchName) {
            [rows] = await db.execute(
                `SELECT emp_id, e_first_name FROM tbl_employee
                 WHERE (e_branch = ?)
                   AND e_designation = 'Executive'
                 ORDER BY e_first_name`, [branchName]
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
