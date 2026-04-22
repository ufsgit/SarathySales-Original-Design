DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_clear_all_data`()
BEGIN
    -- Disable FK checks
    SET FOREIGN_KEY_CHECKS = 0;

    -- DELETE DATA (KEEP LOGIN ID = 1)

    DELETE FROM customer_details WHERE c_id > 0;

    DELETE FROM purchaseitem WHERE purchaseItemId > 0;
    DELETE FROM purchaseitembill WHERE purchaseItemBillId > 0;

    DELETE FROM tbl_branch WHERE b_id > 0;
    DELETE FROM tbl_branch_transfer WHERE lc_id > 0;

    DELETE FROM tbl_employee WHERE emp_id > 0;
    DELETE FROM tbl_gate_pass WHERE gate_pass_id > 0;

    DELETE FROM tbl_insurance_company WHERE com_id > 0;

    DELETE FROM tbl_invoice_labour WHERE inv_id > 0;
    DELETE FROM tbl_labour_code WHERE labour_id > 0;

    -- KEEP ADMIN LOGIN
    DELETE FROM tbl_login WHERE login_id > 1;

    DELETE FROM tbl_model WHERE model_id > 0;

    DELETE FROM tbl_money_receipt WHERE receipt_id > 0;
    DELETE FROM tbl_payslip WHERE payslip_id > 0;

    DELETE FROM tbl_proforma WHERE pro_id > 0;
    DELETE FROM tbl_proforma_item WHERE pro_item_id > 0;

    DELETE FROM tbl_sale_return WHERE inv_id > 0;

    DELETE FROM tbl_stock WHERE stock_id > 0;

    DELETE FROM tbl_tax_slab WHERE id_tax_slab > 0;

    DELETE FROM tbl_vsi_invoice WHERE inv_id > 0;
    DELETE FROM tbl_vsi_invoice_cost WHERE lc_id > 0;

    -- RESET AUTO_INCREMENT

    ALTER TABLE customer_details AUTO_INCREMENT = 1;

    ALTER TABLE purchaseitem AUTO_INCREMENT = 1;
    ALTER TABLE purchaseitembill AUTO_INCREMENT = 1;

    ALTER TABLE tbl_branch AUTO_INCREMENT = 1;
    ALTER TABLE tbl_branch_transfer AUTO_INCREMENT = 1;

    ALTER TABLE tbl_employee AUTO_INCREMENT = 1;
    ALTER TABLE tbl_gate_pass AUTO_INCREMENT = 1;

    ALTER TABLE tbl_insurance_company AUTO_INCREMENT = 1;

    ALTER TABLE tbl_invoice_labour AUTO_INCREMENT = 1;
    ALTER TABLE tbl_labour_code AUTO_INCREMENT = 1;

    ALTER TABLE tbl_login AUTO_INCREMENT = 2;

    ALTER TABLE tbl_model AUTO_INCREMENT = 1;

    ALTER TABLE tbl_money_receipt AUTO_INCREMENT = 1;
    ALTER TABLE tbl_payslip AUTO_INCREMENT = 1;

    ALTER TABLE tbl_proforma AUTO_INCREMENT = 1;
    ALTER TABLE tbl_proforma_item AUTO_INCREMENT = 1;

    ALTER TABLE tbl_sale_return AUTO_INCREMENT = 1;

    ALTER TABLE tbl_stock AUTO_INCREMENT = 1;

    ALTER TABLE tbl_tax_slab AUTO_INCREMENT = 1;

    ALTER TABLE tbl_vsi_invoice AUTO_INCREMENT = 1;
    ALTER TABLE tbl_vsi_invoice_cost AUTO_INCREMENT = 1;

    -- Enable FK checks
    SET FOREIGN_KEY_CHECKS = 1;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `update_labour_tax_data`()
BEGIN
    DECLARE done INT DEFAULT 0;

    DECLARE v_labour_id INT;
    DECLARE v_sale_price DECIMAL(18,2);
    DECLARE v_cgst DECIMAL(18,2);
    DECLARE v_sgst DECIMAL(18,2);
    DECLARE v_cess DECIMAL(18,2);

    DECLARE v_cgst_per DECIMAL(18,2);
    DECLARE v_sgst_per DECIMAL(18,2);
    DECLARE v_cess_per DECIMAL(18,2);
    DECLARE v_gst_per DECIMAL(18,2);
    DECLARE v_igst_per DECIMAL(18,2);

    DECLARE v_tax_id INT;

    DECLARE cur CURSOR FOR 
        SELECT 
            labour_id,
            sale_price,
            CAST(NULLIF(TRIM(cgst), '') AS DECIMAL(18,2)),
            CAST(NULLIF(TRIM(sgst), '') AS DECIMAL(18,2)),
            CAST(NULLIF(TRIM(cess), '') AS DECIMAL(18,2))
        FROM tbl_labour_code;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO v_labour_id, v_sale_price, v_cgst, v_sgst, v_cess;

        IF done THEN
            LEAVE read_loop;
        END IF;

        SET v_tax_id = NULL;

        SET v_sale_price = COALESCE(v_sale_price, 0);
        SET v_cgst = COALESCE(v_cgst, 0);
        SET v_sgst = COALESCE(v_sgst, 0);
        SET v_cess = COALESCE(v_cess, 0);

        IF v_sale_price = 0 THEN
            SET v_cgst_per = 0.00;
            SET v_sgst_per = 0.00;
            SET v_cess_per = 0.00;
            SET v_gst_per  = 0.00;
            SET v_igst_per = 0.00;
        ELSE
            SET v_cgst_per = ROUND((v_cgst / v_sale_price) * 100, 2);
            SET v_sgst_per = ROUND((v_sgst / v_sale_price) * 100, 2);
            SET v_cess_per = ROUND((v_cess / v_sale_price) * 100, 2);
            SET v_gst_per  = v_cgst_per + v_sgst_per;
            SET v_igst_per = v_gst_per;
        END IF;

        SET v_tax_id = (
            SELECT id_tax_slab 
            FROM tbl_tax_slab 
            WHERE ROUND(GST,2)  = ROUND(v_gst_per,2)
              AND ROUND(CGST,2) = ROUND(v_cgst_per,2)
              AND ROUND(SGST,2) = ROUND(v_sgst_per,2)
              AND ROUND(CESS,2) = ROUND(v_cess_per,2)
            LIMIT 1
        );

        IF v_tax_id IS NULL THEN
            IF NOT (v_cgst_per = 0 AND v_sgst_per = 0 AND v_cess_per = 0) THEN
                INSERT INTO tbl_tax_slab (GST, CGST, SGST, IGST, CESS) 
                VALUES (v_gst_per, v_cgst_per, v_sgst_per, v_igst_per, v_cess_per);

                SET v_tax_id = LAST_INSERT_ID();
            ELSE
                SET v_tax_id = NULL;
            END IF;
        END IF;

        -- ✅ ONLY KEEP THIS
        UPDATE tbl_labour_code
        SET id_tax_slab = v_tax_id
        WHERE labour_id = v_labour_id;

    END LOOP;

    CLOSE cur;

END$$
DELIMITER ;
