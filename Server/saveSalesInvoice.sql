CREATE DEFINER=`root`@`localhost` PROCEDURE `saveSalesInvoice`(
    IN p_invoiceNo VARCHAR(100),
    IN p_branchId INT,
    IN p_invoiceDate DATE,
    IN p_customerName VARCHAR(100),
    IN p_chassisNo VARCHAR(100),
    IN p_engineNo VARCHAR(100),
    IN p_regNo VARCHAR(100),
    IN p_adviserId INT,
    IN p_totalAmount VARCHAR(100),
    IN p_mobileNo VARCHAR(100),
    IN p_guardian VARCHAR(100),
    IN p_address VARCHAR(255),
    IN p_issueType VARCHAR(100),
    IN p_age VARCHAR(100),
    IN p_cdmsNo VARCHAR(100),
    IN p_area VARCHAR(100),
    IN p_hypothication VARCHAR(100),
    IN p_place VARCHAR(100),
    IN p_receiptNo VARCHAR(100),
    IN p_financeDues VARCHAR(100),
    IN p_vehicle VARCHAR(100),
    IN p_color VARCHAR(100),
    IN p_gstin VARCHAR(100),
    IN p_basicAmount VARCHAR(100),
    IN p_discountAmount VARCHAR(100),
    IN p_hsnCode VARCHAR(100),
    IN p_taxableAmount VARCHAR(100),
    IN p_sgst VARCHAR(100),
    IN p_cgst VARCHAR(100),
    IN p_cess VARCHAR(100),
    IN p_pincode VARCHAR(100),
    IN p_proformaId INT
)
BEGIN
    -- 1. Declare local variables for internal use
    DECLARE v_materialsId VARCHAR(100);
    DECLARE v_color_id INT;
    DECLARE v_product_id INT;
    DECLARE v_purchaseItemBillId INT;
    DECLARE v_adviserName VARCHAR(100) DEFAULT '';
    
    -- Variables for output response
    DECLARE p_invId INT DEFAULT 0;
    DECLARE p_message VARCHAR(255) DEFAULT '';

    -- 2. Declare Exception Handler for Transaction Rollback
    -- Uses your custom return format instead of RESIGNAL
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_invId = 0;
        SET p_message = 'Database error occurred during execution';
        SELECT p_invId AS invId, p_message AS message;
    END;

    -- 3. Fetch vehicle details (Scoped to current branch and Available status)
    SELECT pi.materialsId, pi.color_id, pi.product_id, pi.purchaseItemBillId
    INTO v_materialsId, v_color_id, v_product_id, v_purchaseItemBillId
    FROM purchaseitem pi
    LEFT JOIN purchaseitembill pb ON pi.purchaseItemBillId = pb.purchaseItemBillId
    WHERE pi.chassis_no = p_chassisNo
      AND pi.item_status = 'Available'
      AND pb.purch_branchId = p_branchId
    LIMIT 1;

       -- 4. Check if vehicle was found
    IF v_materialsId IS NULL THEN
        -- Gracefully return error message for UI
        SET p_invId = 0;
        SET p_message = 'Vehicle not found for this chassis number in this branch';
        SELECT p_invId AS invId, p_message AS message;
    ELSE
    
        -- Fetch Adviser Name if ID is provided (Read operation, fine outside transaction)
        IF p_adviserId IS NOT NULL AND p_adviserId > 0 THEN
            SELECT e_first_name INTO v_adviserName 
            FROM tbl_employee 
            WHERE emp_id = p_adviserId 
            LIMIT 1;
        END IF;

        -- >>> CORRECT: Start Transaction just before you begin modifying data <<<
        START TRANSACTION;

        -- 6. Insert into Master Invoice Table
        INSERT INTO tbl_invoice_labour (
            inv_no, inv_branch, inv_inv_date, inv_cus, inv_chassis, in_engine, inv_regn, 
            inv_advisername, inv_total, inv_pho, inv_cus_father_hus, inv_cus_addres, 
            inv_type, inv_age, inv_cdms_no, inv_area, inv_hypothication, inv_place, 
            inv_receipt_no, inv_finance_dues, inv_vehicle, inv_vehicle_code, inv_color, 
            inv_gstin, inv_basic_amt, inv_discount_amt, inv_hsncode, inv_taxable_amt, 
            inv_sgst, inv_cgst, inv_cess, inv_pincode, status, inv_color_code, inv_product_id
        )
        VALUES (
            p_invoiceNo, p_branchId, IFNULL(p_invoiceDate, CURDATE()), p_customerName, p_chassisNo, p_engineNo, p_regNo,
            v_adviserName, p_totalAmount, p_mobileNo, p_guardian, p_address,
            p_issueType, p_age, p_cdmsNo, p_area, p_hypothication, p_place,
            p_receiptNo, p_financeDues, p_vehicle, v_materialsId, p_color,
            p_gstin, p_basicAmount, p_discountAmount, p_hsnCode, p_taxableAmount,
            p_sgst, p_cgst, p_cess, p_pincode, 1, v_color_id, v_product_id
        );

        -- Get the newly generated ID
        SET p_invId = LAST_INSERT_ID();
	

        -- 7. Update Proforma if ID is passed
        IF p_proformaId IS NOT NULL AND p_proformaId > 0 THEN
            UPDATE tbl_proforma 
            SET pro_status = 2 
            WHERE pro_id = p_proformaId;
        END IF;

        -- 8. Mark Vehicle as Delivered & Decrement Stock
        IF p_chassisNo != '' AND v_purchaseItemBillId IS NOT NULL THEN
            UPDATE purchaseitem 
            SET item_status = 'Delivered' 
            WHERE chassis_no = p_chassisNo 
              AND purchaseItemBillId = v_purchaseItemBillId;

            UPDATE tbl_stock 
            SET stock_quantity = stock_quantity - 1 
            WHERE product_id = v_product_id 
              AND branch_id = p_branchId;
        END IF;

        -- 9. Commit Transaction
        COMMIT;

        -- 10. Return Success message and the new ID
        SET p_message = 'Sales invoice saved successfully';
        SELECT p_invId AS invId, p_message AS message;
        
    END IF;

END