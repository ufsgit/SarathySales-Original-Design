const db = require('../config/db');

/** GET /api/branch/list */
const listBranches = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT b_id, branch_name, branch_address, branch_gstin
             FROM tbl_branch
             ORDER BY branch_name`
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch branches' });
    }
};

/** GET /api/branch/my-branch */
const getMyBranch = async (req, res) => {
    res.json({
        success: true,
        data: {
            branch_id: req.user.branch_id,
            branch_name: req.user.branch_name
        }
    });
};

module.exports = { listBranches, getMyBranch };
