DELIMITER //

DROP PROCEDURE IF EXISTS savePurchaseInvoiceSP //

CREATE PROCEDURE savePurchaseInvoiceSP(
    IN p_invoiceNo VARCHAR(50),
    IN p_branchId INT,
    IN p_invoiceDate DATE,
    IN p_invoiceTime VARCHAR(10),
    IN p_supplierName VARCHAR(100),
    IN p_address TEXT,
    IN p_rcNo VARCHAR(100),
    IN p_rcDate DATE,
    IN p_hsnCode VARCHAR(100),
    IN p_gstin VARCHAR(50),
    IN p_basicTotal VARCHAR(50),
    IN p_taxTotal VARCHAR(50),
    IN p_grandTotal VARCHAR(50),
    IN p_totalAmount VARCHAR(50),
    IN p_items_json JSON
)
BEGIN
    DECLARE v_existingBillCount INT DEFAULT 0;
    DECLARE v_duplicateChassis VARCHAR(50);
    DECLARE v_invId INT;
    
    DECLARE i INT DEFAULT 0;
    DECLARE v_itemCount INT;
    DECLARE v_productId INT;
    DECLARE v_prodCode VARCHAR(50);
    DECLARE v_description TEXT;
    DECLARE v_stockId INT;

    DECLARE _rollback BOOL DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        DECLARE v_error_text TEXT;
        GET DIAGNOSTICS CONDITION 1 v_error_text = MESSAGE_TEXT;
        SET _rollback = 1;
        ROLLBACK;
        SELECT -1 AS inv_id, CONCAT('Failed to save purchase invoice. Error: ', IFNULL(v_error_text, 'Unknown error')) AS message;
    END;

    -- 1. Check for duplicate Invoice Number
    SELECT COUNT(*) INTO v_existingBillCount 
    FROM purchaseitembill 
    WHERE invoiceNo = p_invoiceNo;
    
    IF v_existingBillCount > 0 THEN
        SELECT -2 AS inv_id, CONCAT('Invoice number ', p_invoiceNo, ' already exists.') AS message;
    ELSE
        -- 2. Check for duplicate Chassis Numbers in items
        SELECT chassisNo INTO v_duplicateChassis
        FROM JSON_TABLE(
            p_items_json,
            '$[*]' COLUMNS (
                chassisNo VARCHAR(50) PATH '$.chassisNo'
            )
        ) AS jt
        WHERE jt.chassisNo IS NOT NULL AND jt.chassisNo != ''
        AND EXISTS (
            SELECT 1 FROM purchaseitem WHERE chassis_no = jt.chassisNo
        )
        LIMIT 1;

        IF v_duplicateChassis IS NOT NULL THEN
            SELECT -3 AS inv_id, CONCAT('Chassis number ', v_duplicateChassis, ' already exists in the system.') AS message;
        ELSE
           


             START TRANSACTION;
            -- Insert into purchaseitembill
            INSERT INTO purchaseitembill (
                invoiceNo, purch_branchId, invoiceDate, invoiceTime, pucha_vendorName,
                purcha_vend_addrs, rc_no, rac_date, bill_status, total_bill_amount, hsn_code, purc_gstin,
                purc_basic_total, purc_tax_total, purc_grand_total
            ) VALUES (
                p_invoiceNo, p_branchId, p_invoiceDate, p_invoiceTime, p_supplierName,
                p_address, p_rcNo, p_rcDate, 0, p_totalAmount, p_hsnCode, p_gstin,
                p_basicTotal, p_taxTotal, p_grandTotal
            );

            SET v_invId = LAST_INSERT_ID();

            -- Bulk Insert into purchaseitem
            INSERT INTO purchaseitem (
                purchaseItemBillId, product_id, materialsId, materialName, chassis_no,
                engine_no, color_name, color_id, p_date, sale_type, lc_rate, branch_transfer, item_status, overall_age, item_hsn_code
            )
            SELECT 
                v_invId, 
                jt.productId, 
                IFNULL(jt.prodCode, ''), 
                IFNULL(jt.description, ''),
                IFNULL(jt.chassisNo, ''), 
                IFNULL(jt.engineNo, ''), 
                IFNULL(jt.colorName, ''), 
                IFNULL(jt.colorCode, ''),
                IFNULL(NULLIF(jt.mfgDate, ''), IFNULL(p_invoiceDate, CURDATE())), 
                IFNULL(jt.saleType, ''),
                IFNULL(NULLIF(NULLIF(lc.purchase_cost, ''), 'null'), 0), -- Master cost mapping for lc_rate
                p_branchId, 
                'Available', 
                IFNULL(jt.overall_age, ''), 
                IFNULL(jt.item_hsn_code, '')
            FROM JSON_TABLE(
                p_items_json,
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

            -- Stock Updates: Atomic increment using JSON_TABLE to avoid loops
            
            -- 1. Update existing stock quantities
            UPDATE tbl_stock ts
            INNER JOIN (
                SELECT 
                    productId,
                    COUNT(*) as qty
                FROM JSON_TABLE(
                    p_items_json,
                    '$[*]' COLUMNS (
                        productId INT PATH '$.productId'
                    )
                ) AS jt
                WHERE productId IS NOT NULL AND productId != 0
                GROUP BY productId
            ) as new_stock ON ts.stock_item_id = new_stock.productId AND ts.stock_item_branch = p_branchId
            SET ts.stock_qty = CAST(CAST(COALESCE(NULLIF(ts.stock_qty, ''), '0') AS SIGNED) + new_stock.qty AS CHAR);

            -- 2. Insert new stock records for items that don't exist yet for this branch
            INSERT INTO tbl_stock (stock_item_id, stock_item_code, stock_item_name, stock_item_branch, stock_qty, opening_stock)
            SELECT 
                ns.productId, 
                ns.prodCode, 
                ns.description, 
                p_branchId, 
                CAST(ns.qty AS CHAR), 
                0 -- Transactional increment, so opening stock is 0
            FROM (
                SELECT 
                    productId,
                    MAX(prodCode) as prodCode,
                    MAX(description) as description,
                    COUNT(*) as qty
                FROM JSON_TABLE(
                    p_items_json,
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
                WHERE ts.stock_item_id = ns.productId AND ts.stock_item_branch = p_branchId
            );

            COMMIT;
            
            SELECT v_invId AS inv_id, 'Purchase invoice saved' AS message;
        END IF;
    END IF;
END //

DELIMITER ;
