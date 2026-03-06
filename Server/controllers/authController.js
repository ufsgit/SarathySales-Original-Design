const db = require('../config/db');

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

        console.log('Query:', query);
        console.log('Values:', [username.trim()]);
        console.log('Full DB Result (rows):', JSON.stringify(rows));

        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            console.log('No user found for username:', username);
            return res.status(401).json({
                success: false,
                message: 'Wrong Username or Password!!!'
            });
        }

        const user = rows[0];
        console.log('Extracted User object:', JSON.stringify(user));

        if (!user || typeof user !== 'object') {
            console.log('User row is invalid');
            return res.status(401).json({
                success: false,
                message: 'Wrong Username or Password!!!'
            });
        }

        const submittedPwd = String(password || '').trim();
        const storedPwd = String(user.pwd || '').trim();

        console.log(`Comparison Attempt - Submitted: "${submittedPwd}", Stored: "${storedPwd}"`);

        if (submittedPwd !== storedPwd) {
            console.log('Password mismatch detected');
            return res.status(401).json({
                success: false,
                message: 'Wrong Username or Password!!!'
            });
        }

        console.log('Fetching details for login_id:', user.login_id);
        const [details] = await db.execute(
            `SELECT e.emp_id, e.e_first_name, e.e_branch, e.e_designation, e.status,
                    b.b_id, b.branch_name
             FROM tbl_employee e
             LEFT JOIN tbl_branch b ON e.e_branch = b.branch_name
             WHERE e.emp_login_id = ?`,
            [user.login_id]
        );
        console.log('Raw DB result rows:', JSON.stringify(details));

        const detail = details[0] || {};
        console.log('Detailed employee info:', JSON.stringify(detail));

        const userData = {
            login_id: user.login_id,
            username: user.uname,
            role: user.role,
            role_des: user.role_des,
            branch_id: detail.b_id || null, // Needed for reports
            branch_name: detail.branch_name || detail.e_branch || 'No Branch',
            emp_name: detail.e_first_name || user.uname,
            e_designation: detail.e_designation || 'Not Assigned',
            status: detail.status || 'Unknown'
        };
        console.log('Final userData (aliased):', JSON.stringify(userData));

        return res.status(200).json({
            success: true,
            data: {
                message: 'Login successful',
                user: userData
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
