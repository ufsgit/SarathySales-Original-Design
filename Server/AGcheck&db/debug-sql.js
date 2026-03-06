const db = require('./config/db');

async function listReceipts(req) {
    const branchId = req.query.branchId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    try {
        let conditions = [];
        let params = [];

        if (branchId) {
            conditions.push('tbl_money_receipt.rec_branch_id = ?');
            params.push(branchId);
        }
        if (search) {
            conditions.push('(receipt_no LIKE ? OR receipt_cus LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

        const sql = `SELECT tbl_money_receipt.*, tbl_branch.branch_name FROM tbl_money_receipt
             LEFT JOIN tbl_branch ON tbl_branch.b_id = tbl_money_receipt.rec_branch_id
             ${where} ORDER BY tbl_money_receipt.receipt_id DESC LIMIT ${limit} OFFSET ${offset}`;

        console.log('Main SQL:', sql);
        console.log('Params:', params);

        const [rows] = await db.execute(sql, params);
        console.log('Main Query Success! Count:', rows.length);

        const countSql = `SELECT COUNT(*) as total FROM tbl_money_receipt ${where}`;
        console.log('Count SQL:', countSql);
        const [countRows] = await db.execute(countSql, params);
        console.log('Count Success! Total:', countRows[0].total);

    } catch (err) {
        console.error('SQL ERROR DETECTED:');
        console.error('Message:', err.message);
        console.error('Code:', err.code);
        console.error('Errno:', err.errno);
        console.error('SQLState:', err.sqlState);
        console.error('Query:', err.sql);
    }
}

async function run() {
    console.log('--- Testing with branchId=10 ---');
    await listReceipts({ query: { branchId: '10', page: '1', limit: '25', search: '' } });

    console.log('\n--- Testing with NO branchId ---');
    await listReceipts({ query: { page: '1', limit: '25', search: '' } });

    process.exit(0);
}

run();
