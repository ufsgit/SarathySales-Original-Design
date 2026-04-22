DELIMITER $$

CREATE PROCEDURE sp_clear_all_data()
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