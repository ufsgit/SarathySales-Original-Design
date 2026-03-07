const db = require('../config/db');
const jwt = require('jsonwebtoken');

/**
 * POST /api/auth/login
 * Simple plain-text password check against tbl_login.
 */
const login = async (req, res) => {
    const { username, password } = req.body;
    console.log({ username, password });

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required'
        });
    }

    try {
        const query = `SELECT * FROM tbl_login WHERE uname = ?`;
        const [rows] = await db.execute(query, [username.trim()]);

        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Wrong Username or Password!!!'
            });
        }

        const user = rows[0];
        const submittedPwd = String(password || '').trim();
        const storedPwd = String(user.pwd || '').trim();

        if (submittedPwd !== storedPwd) {
            return res.status(401).json({
                success: false,
                message: 'Wrong Username or Password!!!'
            });
        }

        const [details] = await db.execute(
            `SELECT e.emp_id, e.e_first_name, e.e_branch, e.e_designation, e.status,
                    b.b_id, b.branch_name
             FROM tbl_employee e
             LEFT JOIN tbl_branch b ON e.e_branch = b.branch_name
             WHERE e.emp_login_id = ?`,
            [user.login_id]
        );

        const detail = details[0] || {};

        const userData = {
            login_id: user.login_id,
            username: user.uname,
            role: user.role,
            role_des: user.role_des,
            branch_id: detail.b_id || null,
            branch_name: detail.branch_name || detail.e_branch || 'No Branch',
            emp_name: detail.e_first_name || user.uname,
            e_designation: detail.e_designation || 'Not Assigned',
            status: detail.status || 'Unknown'
        };

        // Generate JWT Token
        const token = jwt.sign(
            userData,
            process.env.JWT_SECRET || 'sarathy_secret_key_2024',
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        return res.status(200).json({
            success: true,
            data: {
                message: 'Login successful',
                user: userData,
                token: token
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * POST /api/auth/change-password
 * Simple plain-text password update.
 */
const changePassword = async (req, res) => {
    const { loginId, oldPassword, newPassword } = req.body;

    if (!loginId || !oldPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        const [rows] = await db.execute('SELECT pwd FROM tbl_login WHERE login_id = ?', [loginId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (oldPassword !== rows[0].pwd) {
            return res.status(400).json({ success: false, message: 'Old password is incorrect' });
        }

        await db.execute('UPDATE tbl_login SET pwd = ? WHERE login_id = ?', [newPassword, loginId]);

        res.json({ success: true, message: 'Password updated successfully' });

    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { login, changePassword };
