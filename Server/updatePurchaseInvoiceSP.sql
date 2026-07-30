DELIMITER //

DROP PROCEDURE IF EXISTS updatePurchaseInvoiceSP //

CREATE PROCEDURE updatePurchaseInvoiceSP(
    IN invoiceNo VARCHAR(50),
    IN branchId INT,
    IN invoiceDate DATE,
    IN supplierName VARCHAR(100),
    IN address TEXT,
    IN rcNo VARCHAR(100),
    IN rcDate DATE,
    IN hsnCode VARCHAR(100),
    IN gstin VARCHAR(50),
    IN basicTotal VARCHAR(50),
    IN taxTotal VARCHAR(50),
    IN grandTotal VARCHAR(50),
    IN items_json JSON
)
BEGIN
    DECLARE v_billId INT;
    DECLARE v_duplicateChassis VARCHAR(50);
    DECLARE v_totalMasterCost DECIMAL(15,2) DEFAULT 0;
    
    DECLARE _rollback BOOL DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        DECLARE v_error_text TEXT;
        GET DIAGNOSTICS CONDITION 1 v_error_text = MESSAGE_TEXT;
        SET _rollback = 1;
        ROLLBACK;
        SELECT -1 AS inv_id, CONCAT('Failed to update purchase invoice. Error: ', IFNULL(v_error_text, 'Unknown error')) AS message;
    END;

    -- 1. Find the invoice
    SELECT purchaseItemBillId INTO v_billId 
    FROM purchaseitembill pb
    WHERE pb.invoiceNo = invoiceNo
    LIMIT 1;

    IF v_billId IS NULL THEN
        SELECT -2 AS inv_id, CONCAT('Invoice not found') AS message;
    ELSE
        -- 2. Check for duplicate Chassis Numbers in other bills
        SELECT chassisNo INTO v_duplicateChassis
        FROM JSON_TABLE(
            items_json,
            '$[*]' COLUMNS (
                chassisNo VARCHAR(50) PATH '$.chassisNo'
            )
        ) AS jt
        WHERE jt.chassisNo IS NOT NULL AND jt.chassisNo != ''
        AND EXISTS (
            SELECT 1 FROM purchaseitem WHERE chassis_no = jt.chassisNo AND purchaseItemBillId <> v_billId
        )
        LIMIT 1;

        IF v_duplicateChassis IS NOT NULL THEN
            SELECT -3 AS inv_id, CONCAT('Chassis number ', v_duplicateChassis, ' already exists in another bill.') AS message;
        ELSE
            -- 3. Calculate total master cost
            SELECT SUM(IFNULL(NULLIF(lc.purchase_cost, ''), 0)) INTO v_totalMasterCost
            FROM JSON_TABLE(
                items_json,
                '$[*]' COLUMNS (
                    productId INT PATH '$.productId'
                )
            ) AS jt
            INNER JOIN tbl_labour_code lc ON lc.labour_id = jt.productId
            WHERE jt.productId IS NOT NULL AND jt.productId != 0;

            START TRANSACTION;

            -- 4. Update main bill
            UPDATE purchaseitembill pb SET 
                pb.purch_branchId = branchId, 
                pb.invoiceDate = invoiceDate, 
                pb.pucha_vendorName = supplierName, 
                pb.purcha_vend_addrs = address,
                pb.rc_no = rcNo, 
                pb.rac_date = rcDate, 
                pb.purc_basic_total = basicTotal, 
                pb.purc_tax_total = taxTotal,
                pb.purc_grand_total = grandTotal, 
                pb.total_bill_amount = COALESCE(v_totalMasterCost, 0), 
                pb.purc_gstin = gstin, 
                pb.hsn_code = hsnCode
            WHERE pb.purchaseItemBillId = v_billId;

            -- 4.5. Revert stock quantities for the existing items before deleting them
            UPDATE tbl_stock ts
            INNER JOIN (
                SELECT product_id, branch_transfer, COUNT(*) as qty
                FROM purchaseitem
                WHERE purchaseItemBillId = v_billId AND product_id IS NOT NULL AND product_id != 0
                GROUP BY product_id, branch_transfer
            ) as old_items ON ts.stock_item_id = old_items.product_id AND ts.stock_item_branch = old_items.branch_transfer
            SET ts.stock_qty = CAST(CAST(COALESCE(NULLIF(ts.stock_qty, ''), '0') AS SIGNED) - old_items.qty AS CHAR);

            -- 5. Delete existing items
            DELETE FROM purchaseitem WHERE purchaseItemBillId = v_billId;

            -- 6. Bulk Insert items
            INSERT INTO purchaseitem (
                purchaseItemBillId, product_id, materialsId, materialName, chassis_no,
                engine_no, color_name, color_id, p_date, sale_type, lc_rate, branch_transfer, item_status, overall_age, item_hsn_code
            )
            SELECT 
                v_billId, 
                jt.productId, 
                IFNULL(jt.prodCode, ''), 
                IFNULL(jt.description, ''),
                IFNULL(jt.chassisNo, ''), 
                IFNULL(jt.engineNo, ''), 
                IFNULL(jt.colorName, ''), 
                IFNULL(jt.colorCode, ''),
                IFNULL(NULLIF(jt.mfgDate, ''), IFNULL(invoiceDate, CURDATE())), 
                IFNULL(jt.saleType, ''),
                IFNULL(NULLIF(NULLIF(lc.purchase_cost, ''), 'null'), 0),
                branchId, 
                'Available', 
                IFNULL(jt.overall_age, ''), 
                IFNULL(jt.item_hsn_code, '')
            FROM JSON_TABLE(
                items_json,
                '$[*]' COLUMNS (
                    productId INT PATH '$.productId',
                    prodCode VARCHAR(50) PATH '$.prodCode',
                    description TEXT PATH '$.description',
                    chassisNo VARCHAR(50) PATH '$.chassisNo',
                    engineNo VARCHAR(50) PATH '$.engineNo',
                    colorName VARCHAR(100) PATH '$.colorName',
                    colorCode VARCHAR(50) PATH '$.colorCode',
                    mfgDate VARCHAR(100) PATH '$.mfgDate',
                    saleType VARCHAR(50) PATH '$.saleType',
                    overall_age VARCHAR(50) PATH '$.overall_age',
                    item_hsn_code VARCHAR(50) PATH '$.item_hsn_code'
                )
            ) AS jt
            INNER JOIN tbl_labour_code lc ON lc.labour_id = jt.productId
            WHERE jt.productId IS NOT NULL AND jt.productId != 0;

            -- 7. Add stock quantities for the new items
            UPDATE tbl_stock ts
            INNER JOIN (
                SELECT 
                    productId,
                    COUNT(*) as qty
                FROM JSON_TABLE(
                    items_json,
                    '$[*]' COLUMNS (
                        productId INT PATH '$.productId'
                    )
                ) AS jt
                WHERE productId IS NOT NULL AND productId != 0
                GROUP BY productId
            ) as new_stock ON ts.stock_item_id = new_stock.productId AND ts.stock_item_branch = branchId
            SET ts.stock_qty = CAST(CAST(COALESCE(NULLIF(ts.stock_qty, ''), '0') AS SIGNED) + new_stock.qty AS CHAR);

            -- 8. Insert new stock records for items that don't exist yet in tbl_stock for this branch
            INSERT INTO tbl_stock (stock_item_id, stock_item_code, stock_item_name, stock_item_branch, stock_qty, opening_stock)
            SELECT 
                ns.productId, 
                ns.prodCode, 
                ns.description, 
                branchId, 
                CAST(ns.qty AS CHAR), 
                0
            FROM (
                SELECT 
                    productId,
                    MAX(prodCode) as prodCode,
                    MAX(description) as description,
                    COUNT(*) as qty
                FROM JSON_TABLE(
                    items_json,
                    '$[*]' COLUMNS (
                        productId INT PATH '$.productId',
                        prodCode VARCHAR(50) PATH '$.prodCode',
                        description TEXT PATH '$.description'
                    )
                ) AS jt
                WHERE productId IS NOT NULL AND productId != 0
                GROUP BY productId
            ) as ns
            WHERE NOT EXISTS (
                SELECT 1 FROM tbl_stock ts 
                WHERE ts.stock_item_id = ns.productId AND ts.stock_item_branch = branchId
            );

            COMMIT;
            
            SELECT v_billId AS inv_id, 'Purchase invoice updated successfully' AS message;
        END IF;
    END IF;
END //

DELIMITER ;
