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
        const table = 'tbl_model';
        const [cols] = await pool.execute(`DESCRIBE ${table}`);
        console.log(`\nColumns for ${table}:`);
        console.table(cols.map(c => ({ Field: c.Field, Type: c.Type })));

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}
check();
