/**
 * Stock Utility for Sarathy Sales
 * Handles atomic stock increments and decrements in tbl_stock.
 */

/**
 * Updates the stock quantity for a specific product and branch.
 * @param {Object} conn - The database connection (should be part of a transaction).
 * @param {number|string} productId - The ID of the product (labour_id).
 * @param {number|string} branchId - The ID of the branch.
 * @param {number} incrementQty - The quantity to add (use negative for decrement).
 */
const updateStockQuantity = async (conn, productId, branchId, incrementQty) => {
    if (!productId || !branchId) {
        console.error('updateStockQuantity: Missing productId or branchId', { productId, branchId });
        return;
    }

    // 1. Check if record exists in tbl_stock
    const [existing] = await conn.execute(
        'SELECT stock_id, stock_qty FROM tbl_stock WHERE stock_item_id = ? AND stock_item_branch = ?',
        [productId, branchId]
    );

    if (existing && existing.length > 0) {
        // 2. Update existing record
        // We use CAST because stock_qty is a varchar(15) in the current schema.
        const sql = `
            UPDATE tbl_stock 
            SET stock_qty = CAST(CAST(COALESCE(NULLIF(stock_qty, ''), '0') AS SIGNED) + ? AS CHAR) 
            WHERE stock_id = ?
        `;
        await conn.execute(sql, [incrementQty, existing[0].stock_id]);
    } else {
        // 3. If no record exists, fetch product details to create a new entry
        const [productRows] = await conn.execute(
            'SELECT labour_code, labour_title FROM tbl_labour_code WHERE labour_id = ?',
            [productId]
        );

        if (!productRows || productRows.length === 0) {
            console.error(`updateStockQuantity: Product ${productId} not found in tbl_labour_code. Skipping stock update.`);
            return;
        }

        const { labour_code, labour_title } = productRows[0];
        
        // Initial quantity is the incrementQty (e.g., 1 for purchase)
        const initialQty = incrementQty.toString();

        const insertSql = `
            INSERT INTO tbl_stock (
                stock_item_id, 
                stock_item_code, 
                stock_item_name, 
                stock_item_branch, 
                stock_qty, 
                opening_stock
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        await conn.execute(insertSql, [
            productId, 
            labour_code, 
            labour_title, 
            branchId, 
            initialQty, 
            "0" // Opening stock is set to 0 as this is a transactional increment
        ]);
    }
};

module.exports = {
    updateStockQuantity
};
