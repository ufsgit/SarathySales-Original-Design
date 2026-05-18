const db = require('../config/db');

/**
 * GET /api/brand/active
 * Fetches the active brand configuration where brand_status = 1
 */
const getActiveBrand = async (req, res) => {
    try {
        const query = 'SELECT brand_id, brand_name, brand_color, brand_status FROM tbl_brand_config WHERE brand_status = 1 LIMIT 1';
        const [rows] = await db.execute(query);

        if (!rows || rows.length === 0) {
            console.warn('⚠️ Brand Configuration: No active brand found in tbl_brand_config');
            return res.status(404).json({
                success: false,
                message: 'No active brand configuration found'
            });
        }

        const activeBrand = rows[0];
        console.log('✅ Fetched active brand data:', activeBrand);

        return res.status(200).json({
            success: true,
            data: activeBrand
        });
    } catch (err) {
        console.error('❌ Error fetching brand configuration:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching brand configuration'
        });
    }
};

module.exports = {
    getActiveBrand
};
