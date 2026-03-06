const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

async function check() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sarathy_sales',
    });

    try {
        const [cols] = await pool.execute('DESCRIBE tbl_branch_transfer');
        console.log('Columns in tbl_branch_transfer:');
        console.table(cols.map(c => ({ Field: c.Field, Type: c.Type })));

        const [rows] = await pool.execute('SELECT * FROM tbl_branch_transfer LIMIT 5');
        console.log('Sample data from tbl_branch_transfer:');
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

check();
