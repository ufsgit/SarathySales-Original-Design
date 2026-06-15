const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directory for logos
const uploadDir = path.join(__dirname, '../public/uploads/logos');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, 'logo_' + Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (png, jpg, jpeg, webp) are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * List all active logos
 */
const listLogos = async (req, res) => {
    try {
        const page   = Math.max(1, parseInt(req.query.page)  || 1);
        const limit  = Math.max(1, parseInt(req.query.limit) || 10);
        const search = (req.query.search || '').trim();
        const offset = (page - 1) * limit;

        const whereClause = search ? `WHERE lm.logo_title LIKE ?` : '';
        const params      = search ? [`%${search}%`] : [];

        const [[{ total }]] = await db.execute(
            `SELECT COUNT(*) AS total FROM logo_master lm ${whereClause}`,
            params
        );

        const [rows] = await db.execute(`
            SELECT 
                lm.*,
                GROUP_CONCAT(b.branch_name ORDER BY b.branch_name SEPARATOR ', ') AS assigned_branches
            FROM logo_master lm
            LEFT JOIN tbl_branch b ON b.logo_id = lm.logo_id
            ${whereClause}
            GROUP BY lm.logo_id
            ORDER BY lm.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `, params);

        res.status(200).json({
            success: true,
            data: rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching logos:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch logos' });
    }
};

/**
 * Get logo by ID
 */
const getLogoById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute('SELECT * FROM logo_master WHERE logo_id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Logo not found' });
        }
        
        res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching logo by id:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch logo' });
    }
};

/**
 * Create a new logo
 */
const createLogo = async (req, res) => {
    try {
        const { title } = req.body;
        
        if (!title || title.trim() === '') {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: 'Logo title is required' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Logo image is required' });
        }

        const logoUrl = `/uploads/logos/${req.file.filename}`;

        const [result] = await db.execute(
            'INSERT INTO logo_master (logo_title, logo_url, is_active) VALUES (?, ?, 1)',
            [title.trim(), logoUrl]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Logo added successfully',
            data: {
                logo_id: result.insertId,
                logo_title: title.trim(),
                logo_url: logoUrl
            }
        });
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Error creating logo:', error);
        res.status(500).json({ success: false, message: 'Failed to add logo' });
    }
};

/**
 * Update logo (Title or Status)
 */
const updateLogo = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, is_active } = req.body;
        
        if (!title || title.trim() === '') {
            return res.status(400).json({ success: false, message: 'Logo title is required' });
        }

        const [existing] = await db.execute('SELECT * FROM logo_master WHERE logo_id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Logo not found' });
        }

        await db.execute(
            'UPDATE logo_master SET logo_title = ?, is_active = ? WHERE logo_id = ?',
            [title.trim(), is_active !== undefined ? is_active : existing[0].is_active, id]
        );

        res.status(200).json({ success: true, message: 'Logo updated successfully' });
    } catch (error) {
        console.error('Error updating logo:', error);
        res.status(500).json({ success: false, message: 'Failed to update logo' });
    }
};

/**
 * Update logo with new image file
 */
const updateLogoWithImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        if (!title || title.trim() === '') {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: 'Logo title is required' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Logo image is required' });
        }

        const [existing] = await db.execute('SELECT * FROM logo_master WHERE logo_id = ?', [id]);
        if (existing.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: 'Logo not found' });
        }

        // Delete old image file
        if (existing[0].logo_url) {
            const oldPath = path.join(__dirname, '../public', existing[0].logo_url);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        const newLogoUrl = `/uploads/logos/${req.file.filename}`;

        await db.execute(
            'UPDATE logo_master SET logo_title = ?, logo_url = ? WHERE logo_id = ?',
            [title.trim(), newLogoUrl, id]
        );

        res.status(200).json({ success: true, message: 'Logo updated successfully' });
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error('Error updating logo with image:', error);
        res.status(500).json({ success: false, message: 'Failed to update logo' });
    }
};

/**
 * Delete logo
 */
const deleteLogo = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [existing] = await db.execute('SELECT * FROM logo_master WHERE logo_id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Logo not found' });
        }

        // Delete file if it exists
        if (existing[0].logo_url) {
            const filePath = path.join(__dirname, '../public', existing[0].logo_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await db.execute('DELETE FROM logo_master WHERE logo_id = ?', [id]);

        res.status(200).json({ success: true, message: 'Logo deleted successfully' });
    } catch (error) {
        console.error('Error deleting logo:', error);
        res.status(500).json({ success: false, message: 'Failed to delete logo' });
    }
};

module.exports = {
    upload,
    listLogos,
    getLogoById,
    createLogo,
    updateLogo,
    updateLogoWithImage,
    deleteLogo
};
