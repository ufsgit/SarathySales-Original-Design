const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

async function checkTable() {
    // Try to find .env in common locations
    const envPaths = [
        path.join(__dirname, '../Server/.env'),
        path.join(__dirname, './Server/.env'),
        'd:/mean project/sarathy Sales folder/SarathySales-Original-Design/Server/.env'
    ];

    let envPath = envPaths.find(p => fs.existsSync(p));
    if (envPath) {
        require('dotenv').config({ path: envPath });
    }

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sarathysales'
    });

    try {
        const [rows] = await connection.query('DESCRIBE tbl_sale_return');
        console.log('Columns in tbl_sale_return:');
        rows.forEach(row => console.log(`- ${row.Field} (${row.Type})`));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

checkTable();
