const db = require('../config/db');

async function test() {
    try {
        const [r] = await db.execute(
            `INSERT INTO tbl_labour_code 
            (labour_code, labour_title, repair_type, fa_weight, ra_weight, oa_weight, hsn_code, 
            ta_weight, ul_weight, r_weight, hp, discription, 
            cc, tbody, no_of_cylider, fuel, wheel_base, booking_code, 
            seat_capacity, sale_price, cgst, sgst, cess, purchase_cost, total_price) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ['TEST01','Test Product','Class1','10','20','30','HSN001','40','50','60','100HP','Test desc',
             '500cc','2-Wheeler','1','Petrol','120cm','BK001','2','50000','9','9','1','45000','50019']
        );
        console.log('✅ Insert OK, id =', r.insertId);
    } catch(e) {
        console.error('❌ Error:', e.message);
    } finally {
        process.exit(0);
    }
}
test();
