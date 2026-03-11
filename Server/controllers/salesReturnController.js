const db = require('../config/db');

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

module.exports = {
    getSalesReturnReport
};
