const mysql = require('mysql2/promise');
require('dotenv').config();

async function debug() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sarathy_sales'
    });

    const query = {
        branchId: '10', // From the error log
        from: '2026-02-23',
        to: '2026-02-23',
        page: '1',
        limit: '10'
    };

    const branchId = query.branchId;
    const from = query.from;
    const to = query.to;
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.max(1, parseInt(query.limit) || 25);
    const offset = (page - 1) * limit;

    try {
        console.log('--- Testing Rows Query ---');
        // Note: I am testing with 'purchase' first to see if it causes any ERROR, even if 0 results
        let conditions = ["DATE(tbl_invoice_labour.inv_inv_date) BETWEEN ? AND ?", "tbl_invoice_labour.inv_type = 'purchase'"];
        let params = [from, to];

        if (branchId) {
            conditions.push('tbl_invoice_labour.inv_branch = ?');
            params.push(branchId);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const sql = `SELECT tbl_invoice_labour.*, tbl_branch.branch_name FROM tbl_invoice_labour
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_invoice_labour.inv_branch
             ${where} ORDER BY inv_inv_date DESC LIMIT ${limit} OFFSET ${offset}`;

        console.log('SQL:', sql);
        console.log('Params:', params);

        const [rows] = await db.execute(sql, params);
        console.log('Success! Rows found:', rows.length);

        console.log('--- Testing Count Query ---');
        const countSql = `SELECT COUNT(*) as total FROM tbl_invoice_labour ${where}`;
        console.log('Count SQL:', countSql);
        const [countRows] = await db.execute(countSql, params);
        console.log('Success! Total:', countRows[0].total);

        console.log('--- Checking inv_type values again with more rows ---');
        const [types] = await db.execute('SELECT DISTINCT inv_type FROM tbl_invoice_labour');
        console.log('Distinct types:', types.map(t => t.inv_type));

    } catch (err) {
        console.error('FAILED with error:', err.message);
        if (err.sql) console.error('Problematic SQL:', err.sql);
    } finally {
        await db.end();
    }
}

debug();
