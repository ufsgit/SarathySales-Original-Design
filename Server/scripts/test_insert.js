const db = require('../config/db');

async function testInsert() {
    try {
        const [result] = await db.execute(
            'INSERT INTO tbl_branch (branch_id, branch_name, branch_address, branch_location, branch_pin, branch_gstin, branch_ph, branch_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['1', '2', 'Address', '4', '5', '6464643636', '7890', '8']
        );
        console.log('✅ Success:', result.insertId);
    } catch (err) {
        console.error('❌ Error Code:', err.code);
        console.error('❌ Error Message:', err.message);
        console.error('❌ SQL:', err.sql);
    } finally {
        process.exit(0);
    }
}

testInsert();
