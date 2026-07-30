DELIMITER //

DROP PROCEDURE IF EXISTS bulkPurchaseUploadSP //

CREATE PROCEDURE bulkPurchaseUploadSP(
    IN p_branchId INT,
    IN p_items_json JSON
)
BEGIN
    DECLARE v_duplicateChassis VARCHAR(50);
    DECLARE v_duplicateInvoice VARCHAR(50);
    DECLARE _rollback BOOL DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        DECLARE v_error_text TEXT;
        GET DIAGNOSTICS CONDITION 1 v_error_text = MESSAGE_TEXT;
        SET _rollback = 1;
        ROLLBACK;
        SELECT -1 AS success, CONCAT('Failed to bulk upload purchases. Error: ', IFNULL(v_error_text, 'Unknown error')) AS message;
    END;

    -- 1. Check for duplicate Chassis Numbers in DB
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
        SELECT -3 AS success, CONCAT('Chassis number ''', v_duplicateChassis, ''' already exists in the system.') AS message;
    ELSE
        -- 2. Check for duplicate Invoices in DB
        SELECT invoiceNo INTO v_duplicateInvoice
        FROM JSON_TABLE(
            p_items_json,
            '$[*]' COLUMNS (
                invoiceNo VARCHAR(50) PATH '$.invoiceNo'
            )
        ) AS jt
        WHERE jt.invoiceNo IS NOT NULL AND jt.invoiceNo != ''
        AND EXISTS (
            SELECT 1 FROM purchaseitembill WHERE invoiceNo = jt.invoiceNo
        )
        LIMIT 1;

        IF v_duplicateInvoice IS NOT NULL THEN
            SELECT -4 AS success, CONCAT('Supplier Invoice No ''', v_duplicateInvoice, ''' already exists.') AS message;
        ELSE
            START TRANSACTION;

            -- 3. Auto-add new Models (tbl_labour_code)
            INSERT IGNORE INTO tbl_labour_code (
                labour_code, labour_title, discription, repair_type, hsn_code,
                fa_weight, ra_weight, oa_weight, ta_weight, ul_weight, r_weight, hp, cc, tbody, no_of_cylider, fuel, wheel_base, booking_code, seat_capacity,
                sale_price, purchase_cost, cgst, sgst, total_price, cess
            )
            SELECT DISTINCT
                jt.modelCode, 
                IFNULL(NULLIF(jt.modelName, ''), jt.modelCode), 
                IFNULL(NULLIF(jt.modelName, ''), jt.modelCode), 
                'Major', 
                IFNULL(jt.itemHsnCode, ''),
                '', '', '', '', '', '', '', '', '', '', '', '', '', '', '0.00', 
                jt.excelCost, '0.00', '0.00', '0.00', '0.00'
            FROM JSON_TABLE(
                p_items_json,
                '$[*]' COLUMNS (
                    modelCode VARCHAR(50) PATH '$.modelCode',
                    modelName VARCHAR(100) PATH '$.modelName',
                    itemHsnCode VARCHAR(50) PATH '$.itemHsnCode',
                    excelCost DECIMAL(15,2) PATH '$.excelCost'
                )
            ) AS jt
            WHERE jt.modelCode IS NOT NULL AND jt.modelCode != ''
            AND NOT EXISTS (
                SELECT 1 FROM tbl_labour_code lc WHERE lc.labour_code = jt.modelCode
            );

            -- 4. Auto-add new Colors (tbl_model)
            INSERT IGNORE INTO tbl_model (mod_code, mod_name)
            SELECT DISTINCT
                jt.colorCode,
                IFNULL(NULLIF(jt.colorName, ''), jt.colorCode)
            FROM JSON_TABLE(
                p_items_json,
                '$[*]' COLUMNS (
                    colorCode VARCHAR(50) PATH '$.colorCode',
                    colorName VARCHAR(100) PATH '$.colorName'
                )
            ) AS jt
            WHERE jt.colorCode IS NOT NULL AND jt.colorCode != ''
            AND NOT EXISTS (
                SELECT 1 FROM tbl_model c WHERE c.mod_code = jt.colorCode
            );

            -- 5. Insert Purchase Bills (Invoices)
            INSERT INTO purchaseitembill (
                invoiceNo, purch_branchId, invoiceDate, invoiceTime, pucha_vendorName, purcha_vend_addrs,
                rc_no, rac_date, hsn_code, purc_gstin, bill_status, 
                purc_basic_total, purc_tax_total, purc_grand_total, total_bill_amount
            )
            SELECT 
                inv.invoiceNo, 
                p_branchId, 
                MAX(inv.invoiceDate), 
                MAX(inv.invoiceTime), 
                MAX(inv.supplierName), 
                MAX(inv.vendorAddress),
                MAX(inv.rcNo), 
                MAX(NULLIF(inv.rcDate, '')), 
                MAX(inv.hsnCode), 
                MAX(inv.gstin), 
                0, 
                MAX(inv.uiBasic), 
                MAX(inv.uiTax), 
                MAX(inv.uiGrand), 
                SUM(inv.excelCost)
            FROM JSON_TABLE(
                p_items_json,
                '$[*]' COLUMNS (
                    invoiceNo VARCHAR(50) PATH '$.invoiceNo',
                    invoiceDate VARCHAR(50) PATH '$.invoiceDate',
                    invoiceTime VARCHAR(50) PATH '$.invoiceTime',
                    supplierName VARCHAR(100) PATH '$.supplierName',
                    vendorAddress TEXT PATH '$.vendorAddress',
                    rcNo VARCHAR(50) PATH '$.rcNo',
                    rcDate VARCHAR(50) PATH '$.rcDate',
                    hsnCode VARCHAR(50) PATH '$.hsnCode',
                    gstin VARCHAR(50) PATH '$.gstin',
                    uiBasic DECIMAL(15,2) PATH '$.uiBasic',
                    uiTax DECIMAL(15,2) PATH '$.uiTax',
                    uiGrand DECIMAL(15,2) PATH '$.uiGrand',
                    excelCost DECIMAL(15,2) PATH '$.excelCost'
                )
            ) AS inv
            WHERE inv.invoiceNo IS NOT NULL AND inv.invoiceNo != ''
            GROUP BY inv.invoiceNo;

            -- 6. Insert Purchase Items
            INSERT INTO purchaseitem (
                purchaseItemBillId, product_id, materialsId, materialName, chassis_no,
                lc_rate, engine_no, color_name, color_id, p_date, sale_type, model_family, item_hsn_code, overall_age, branch_transfer, item_status
            )
            SELECT 
                pib.purchaseItemBillId, 
                lc.labour_id, 
                jt.modelCode, 
                IFNULL(jt.modelName, ''), 
                jt.chassisNo,
                jt.excelCost, 
                jt.engineNo, 
                jt.colorName, 
                jt.colorCode, 
                NULLIF(jt.mfgDate, ''), 
                jt.saleType, 
                jt.modelFamily, 
                IFNULL(NULLIF(jt.itemHsnCode, ''), lc.hsn_code), 
                jt.overallAge, 
                p_branchId, 
                'Available'
            FROM JSON_TABLE(
                p_items_json,
                '$[*]' COLUMNS (
                    invoiceNo VARCHAR(50) PATH '$.invoiceNo',
                    modelCode VARCHAR(50) PATH '$.modelCode',
                    modelName VARCHAR(100) PATH '$.modelName',
                    chassisNo VARCHAR(50) PATH '$.chassisNo',
                    engineNo VARCHAR(50) PATH '$.engineNo',
                    colorCode VARCHAR(50) PATH '$.colorCode',
                    colorName VARCHAR(100) PATH '$.colorName',
                    mfgDate VARCHAR(50) PATH '$.mfgDate',
                    saleType VARCHAR(50) PATH '$.saleType',
                    modelFamily VARCHAR(50) PATH '$.modelFamily',
                    itemHsnCode VARCHAR(50) PATH '$.itemHsnCode',
                    overallAge VARCHAR(50) PATH '$.overallAge',
                    excelCost DECIMAL(15,2) PATH '$.excelCost'
                )
            ) AS jt
            INNER JOIN purchaseitembill pib ON pib.invoiceNo = jt.invoiceNo
            INNER JOIN tbl_labour_code lc ON lc.labour_code = jt.modelCode;

            -- 7. Update Stock for existing items
            UPDATE tbl_stock ts
            INNER JOIN (
                SELECT 
                    lc.labour_id AS productId,
                    COUNT(*) as qty
                FROM JSON_TABLE(
                    p_items_json,
                    '$[*]' COLUMNS (
                        modelCode VARCHAR(50) PATH '$.modelCode'
                    )
                ) AS jt
                INNER JOIN tbl_labour_code lc ON lc.labour_code = jt.modelCode
                GROUP BY lc.labour_id
            ) as new_stock ON ts.stock_item_id = new_stock.productId AND ts.stock_item_branch = p_branchId
            SET ts.stock_qty = CAST(CAST(COALESCE(NULLIF(ts.stock_qty, ''), '0') AS SIGNED) + new_stock.qty AS CHAR);

            -- 8. Insert new stock records
            INSERT INTO tbl_stock (stock_item_id, stock_item_code, stock_item_name, stock_item_branch, stock_qty, opening_stock)
            SELECT 
                ns.productId, 
                ns.modelCode, 
                ns.modelName, 
                p_branchId, 
                CAST(ns.qty AS CHAR), 
                '0'
            FROM (
                SELECT 
                    lc.labour_id AS productId,
                    MAX(jt.modelCode) as modelCode,
                    MAX(IFNULL(jt.modelName, '')) as modelName,
                    COUNT(*) as qty
                FROM JSON_TABLE(
                    p_items_json,
                    '$[*]' COLUMNS (
                        modelCode VARCHAR(50) PATH '$.modelCode',
                        modelName VARCHAR(100) PATH '$.modelName'
                    )
                ) AS jt
                INNER JOIN tbl_labour_code lc ON lc.labour_code = jt.modelCode
                GROUP BY lc.labour_id
            ) as ns
            WHERE NOT EXISTS (
                SELECT 1 FROM tbl_stock ts 
                WHERE ts.stock_item_id = ns.productId AND ts.stock_item_branch = p_branchId
            );

            COMMIT;
            
            SELECT 1 AS success, 'Bulk upload completed successfully' AS message;
        END IF;
    END IF;
END //

DELIMITER ;
