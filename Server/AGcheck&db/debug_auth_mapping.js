const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

async function debug() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sarathy_sales',
    });

    try {
        const [logins] = await pool.execute('SELECT login_id, uname FROM tbl_login LIMIT 5');
        console.log('Sample Logins:', logins);

        for (const login of logins) {
            const [emps] = await pool.execute('SELECT * FROM tbl_employee WHERE emp_login_id = ?', [login.login_id]);
            console.log(`Employee for ${login.uname} (ID: ${login.login_id}):`, emps);
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

debug();
