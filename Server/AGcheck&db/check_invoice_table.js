const db = require('./config/db');
async function checkTable() {
    try {
        const [rows] = await db.execute('DESCRIBE tbl_invoice_labour');
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
checkTable();
