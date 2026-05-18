-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: sarathysalesnewchk
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `customer_details`
--

DROP TABLE IF EXISTS `customer_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_details` (
  `c_id` int NOT NULL AUTO_INCREMENT,
  `c_name` varchar(50) NOT NULL,
  `c_address` text NOT NULL,
  `c_reg_no` varchar(50) NOT NULL,
  `c_dealership_code` varchar(50) NOT NULL,
  `c_contact_no` varchar(100) NOT NULL,
  `cst_no` varchar(50) DEFAULT NULL,
  `lst_no` varchar(50) DEFAULT NULL,
  `c_email` varchar(170) NOT NULL,
  PRIMARY KEY (`c_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `purchaseitem`
--

DROP TABLE IF EXISTS `purchaseitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchaseitem` (
  `purchaseItemId` int unsigned NOT NULL AUTO_INCREMENT,
  `purchaseItemBillId` int unsigned DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `materialsId` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `materialName` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci,
  `chassis_no` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `lc_rate` double NOT NULL,
  `engine_no` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `color_name` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `color_id` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `p_date` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `sale_type` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `branch_transfer` int DEFAULT NULL,
  `model_family` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `item_hsn_code` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `overall_age` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `item_status` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL COMMENT 'Transfered,Delivered,Available',
  `retn_status` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT 'Available',
  PRIMARY KEY (`purchaseItemId`)
) ENGINE=MyISAM AUTO_INCREMENT=7419 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `purchaseitembill`
--

DROP TABLE IF EXISTS `purchaseitembill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchaseitembill` (
  `purchaseItemBillId` int unsigned NOT NULL AUTO_INCREMENT,
  `invoiceNo` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `purch_branchId` int DEFAULT NULL,
  `invoiceDate` date DEFAULT NULL,
  `invoiceTime` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `pucha_vendorName` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `purcha_vend_addrs` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci,
  `rc_no` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `rac_date` date DEFAULT NULL,
  `bill_status` int DEFAULT '0',
  `total_bill_amount` bigint DEFAULT NULL,
  `hsn_code` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `purc_gstin` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `purc_basic_total` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `purc_tax_total` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `purc_grand_total` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`purchaseItemBillId`)
) ENGINE=MyISAM AUTO_INCREMENT=3775 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_branch`
--

DROP TABLE IF EXISTS `tbl_branch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_branch` (
  `b_id` int NOT NULL AUTO_INCREMENT,
  `branch_id` varchar(20) DEFAULT NULL,
  `branch_name` varchar(500) NOT NULL,
  `branch_address` varchar(1000) NOT NULL,
  `branch_ph` varchar(50) NOT NULL,
  `branch_pin` int NOT NULL,
  `branch_gstin` varchar(50) NOT NULL,
  `branch_email` varchar(150) NOT NULL,
  `branch_location` varchar(200) DEFAULT NULL,
  `branch_prefix` varchar(100) NOT NULL DEFAULT 'KLM',
  PRIMARY KEY (`b_id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_branch_transfer`
--

DROP TABLE IF EXISTS `tbl_branch_transfer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_branch_transfer` (
  `lc_id` int NOT NULL AUTO_INCREMENT,
  `ic_branch` int NOT NULL,
  `debit_note_no` varchar(100) NOT NULL,
  `debit_note_date` date DEFAULT NULL,
  `issue_type` varchar(100) NOT NULL,
  `lnstitute_branch_id` int NOT NULL,
  `lnstitute_name` varchar(100) NOT NULL,
  `institute_addrss` text NOT NULL,
  `chassis_no` varchar(100) NOT NULL,
  `engine_no` varchar(100) NOT NULL,
  `vehicle` varchar(100) NOT NULL,
  `vehicle_code` varchar(100) NOT NULL,
  `vehicle_color` varchar(100) NOT NULL,
  `vehicle_color_id` varchar(50) DEFAULT NULL,
  `product_id` varchar(100) NOT NULL,
  `trans_total` varchar(50) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  PRIMARY KEY (`lc_id`),
  KEY `ic_inv_id` (`ic_branch`)
) ENGINE=InnoDB AUTO_INCREMENT=3351 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_brand_config`
--

DROP TABLE IF EXISTS `tbl_brand_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_brand_config` (
  `brand_id` int NOT NULL AUTO_INCREMENT,
  `brand_name` varchar(100) NOT NULL,
  `brand_color` varchar(10) NOT NULL DEFAULT '#3e424b' COMMENT 'Hex color code e.g. #f36f21',
  `brand_status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=Active, 0=Inactive',
  PRIMARY KEY (`brand_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_employee`
--

DROP TABLE IF EXISTS `tbl_employee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_employee` (
  `emp_id` int NOT NULL AUTO_INCREMENT,
  `emp_login_id` int DEFAULT NULL,
  `emp_intial` text NOT NULL,
  `e_first_name` text NOT NULL,
  `e_branch` varchar(50) NOT NULL,
  `e_address` mediumtext,
  `e_mobile` varchar(25) DEFAULT NULL,
  `e_email` varchar(250) DEFAULT NULL,
  `e_code` varchar(50) NOT NULL,
  `e_designation` varchar(50) NOT NULL,
  `status` varchar(10) NOT NULL,
  PRIMARY KEY (`emp_id`)
) ENGINE=InnoDB AUTO_INCREMENT=134 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_gate_pass`
--

DROP TABLE IF EXISTS `tbl_gate_pass`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_gate_pass` (
  `gate_pass_id` int NOT NULL AUTO_INCREMENT,
  `gate_invoice_id` int NOT NULL,
  `gate_pass_no` varchar(100) NOT NULL,
  `gate_pass_date` date NOT NULL,
  `gate_branch_id` int NOT NULL,
  `pass_issue_type` varchar(100) NOT NULL,
  `pass_cus_name` varchar(100) NOT NULL,
  `pass_invoic_no` varchar(100) NOT NULL COMMENT 'invoice table invoice no',
  `pass_cus_addrs` text NOT NULL,
  `selection_date` date NOT NULL,
  `pass_chassis_no` varchar(100) NOT NULL,
  `pass_engine_no` varchar(50) NOT NULL,
  `pass_vehicle` varchar(150) NOT NULL,
  `pass_vehicle_color` varchar(50) NOT NULL,
  `pass_vehicle_code` varchar(100) NOT NULL,
  `pass_status` int NOT NULL,
  PRIMARY KEY (`gate_pass_id`)
) ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_insurance_company`
--

DROP TABLE IF EXISTS `tbl_insurance_company`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_insurance_company` (
  `com_id` int NOT NULL AUTO_INCREMENT,
  `icompany_name` varchar(200) NOT NULL,
  `icompany_address` text,
  `icompany_gst` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`com_id`)
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_invoice_labour`
--

DROP TABLE IF EXISTS `tbl_invoice_labour`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_invoice_labour` (
  `inv_id` int NOT NULL AUTO_INCREMENT,
  `inv_no` varchar(500) NOT NULL,
  `inv_cus` varchar(100) NOT NULL,
  `inv_cus_addres` varchar(1000) NOT NULL,
  `inv_pho` varchar(100) NOT NULL,
  `inv_cus_father_hus` varchar(100) DEFAULT NULL,
  `inv_inv_date` date NOT NULL,
  `inv_type` varchar(100) NOT NULL,
  `inv_age` varchar(100) NOT NULL,
  `inv_cdms_no` varchar(50) NOT NULL,
  `inv_area` varchar(100) NOT NULL,
  `inv_hypothication` varchar(100) NOT NULL,
  `inv_chassis` varchar(100) NOT NULL,
  `in_engine` varchar(100) NOT NULL,
  `inv_place` varchar(100) NOT NULL,
  `inv_receipt_no` varchar(100) NOT NULL,
  `inv_regn` varchar(100) NOT NULL,
  `inv_advisername` varchar(100) NOT NULL,
  `inv_finance_dues` varchar(100) DEFAULT NULL,
  `inv_branch` varchar(100) NOT NULL,
  `inv_vehicle` varchar(100) NOT NULL,
  `inv_vehicle_code` varchar(100) NOT NULL,
  `inv_color` varchar(100) NOT NULL,
  `inv_color_code` varchar(100) NOT NULL,
  `inv_total` varchar(100) NOT NULL,
  `inv_product_id` int DEFAULT NULL,
  `status` int NOT NULL DEFAULT '0',
  `inv_gstin` varchar(150) DEFAULT NULL,
  `inv_basic_amt` varchar(150) DEFAULT NULL,
  `inv_discount_amt` varchar(100) DEFAULT NULL,
  `inv_hsncode` varchar(50) DEFAULT NULL,
  `inv_taxable_amt` varchar(100) DEFAULT NULL,
  `inv_sgst` varchar(100) DEFAULT NULL,
  `inv_cgst` varchar(100) DEFAULT NULL,
  `inv_cess` varchar(50) DEFAULT NULL,
  `inv_pincode` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`inv_id`),
  KEY `inv_inv_date` (`inv_inv_date`),
  KEY `inv_branch` (`inv_branch`),
  KEY `status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=3807 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_labour_code`
--

DROP TABLE IF EXISTS `tbl_labour_code`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_labour_code` (
  `labour_id` int NOT NULL AUTO_INCREMENT,
  `labour_title` varchar(100) NOT NULL,
  `labour_code` varchar(100) NOT NULL,
  `discription` varchar(100) NOT NULL,
  `repair_type` varchar(30) NOT NULL,
  `sale_price` int DEFAULT NULL,
  `fa_weight` varchar(50) NOT NULL,
  `ra_weight` varchar(50) NOT NULL,
  `oa_weight` varchar(50) NOT NULL,
  `hsn_code` varchar(50) DEFAULT NULL,
  `ta_weight` varchar(50) NOT NULL,
  `ul_weight` varchar(50) NOT NULL,
  `r_weight` varchar(50) NOT NULL,
  `hp` varchar(50) NOT NULL,
  `cc` varchar(50) NOT NULL,
  `tbody` varchar(100) NOT NULL,
  `no_of_cylider` varchar(50) NOT NULL,
  `fuel` varchar(100) NOT NULL,
  `wheel_base` varchar(50) NOT NULL,
  `booking_code` varchar(100) NOT NULL,
  `seat_capacity` varchar(50) NOT NULL,
  `cgst` varchar(50) NOT NULL,
  `sgst` varchar(50) NOT NULL,
  `cess` varchar(50) NOT NULL,
  `total_price` varchar(50) DEFAULT NULL,
  `purchase_cost` varchar(15) DEFAULT NULL,
  `id_tax_slab` int DEFAULT NULL,
  PRIMARY KEY (`labour_id`)
) ENGINE=InnoDB AUTO_INCREMENT=105 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_login`
--

DROP TABLE IF EXISTS `tbl_login`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_login` (
  `login_id` int NOT NULL AUTO_INCREMENT,
  `uname` varchar(20) NOT NULL,
  `pwd` text NOT NULL,
  `role` int NOT NULL COMMENT '1-Admin,2-Staff',
  `role_des` varchar(20) NOT NULL,
  PRIMARY KEY (`login_id`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_model`
--

DROP TABLE IF EXISTS `tbl_model`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_model` (
  `model_id` int NOT NULL AUTO_INCREMENT,
  `mod_code` varchar(20) NOT NULL,
  `mod_name` varchar(50) NOT NULL,
  PRIMARY KEY (`model_id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_money_receipt`
--

DROP TABLE IF EXISTS `tbl_money_receipt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_money_receipt` (
  `receipt_id` int NOT NULL AUTO_INCREMENT,
  `rec_branch_id` int NOT NULL,
  `receipt_no` varchar(100) NOT NULL,
  `receipt_date` date NOT NULL,
  `reference` varchar(150) NOT NULL,
  `reason` text NOT NULL,
  `pay_type` text NOT NULL,
  `cheque_dd_date` varchar(50) NOT NULL,
  `cheque_dd_po_no` varchar(150) NOT NULL,
  `receipt_cus` varchar(250) NOT NULL,
  `receipt_cus_address` text NOT NULL,
  `receipt_amount` varchar(100) NOT NULL,
  `bank_name` varchar(150) NOT NULL,
  `bank_place` varchar(100) NOT NULL,
  `refund_status` varchar(50) NOT NULL,
  PRIMARY KEY (`receipt_id`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_payslip`
--

DROP TABLE IF EXISTS `tbl_payslip`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_payslip` (
  `payslip_id` int NOT NULL AUTO_INCREMENT,
  `pay_branch_id` int NOT NULL,
  `pay_slip_no` varchar(50) NOT NULL,
  `pay_slip_date` date NOT NULL,
  `pay_finance` varchar(150) DEFAULT NULL COMMENT 'finance company name or cash',
  `pay_slip_reference` varchar(100) NOT NULL COMMENT 'vehicle  name',
  `pay_regn` varchar(100) NOT NULL COMMENT 'executive name',
  `pay_regn_fee` varchar(50) NOT NULL COMMENT 'add register fee',
  `pay_cus_name` varchar(150) NOT NULL,
  `pay_vehil_type` varchar(50) NOT NULL,
  `pay_vehile_amt` varchar(150) NOT NULL COMMENT 'add vehicl amt',
  `pay_remarks` text NOT NULL,
  `pay_vp_charge` varchar(50) NOT NULL COMMENT 'add vp charge',
  `pay_insurance` varchar(100) NOT NULL COMMENT 'add isurance',
  `pay_road_tax` varchar(100) NOT NULL COMMENT 'add road tax',
  `pay_dcc` varchar(50) NOT NULL COMMENT 'less finance amount',
  `pay_exchange` varchar(50) NOT NULL COMMENT 'less exchange',
  `pay_discount` varchar(50) NOT NULL COMMENT 'less discnt',
  `pay_bfl` varchar(50) NOT NULL COMMENT 'less bfl dicount',
  `pay_advance` varchar(50) NOT NULL COMMENT 'less advance cash',
  `pay_dues` varchar(50) NOT NULL COMMENT 'less dues amt',
  `pay_exted_wanty` varchar(50) NOT NULL COMMENT 'add extende warrenty',
  `pay_service_chrge` varchar(50) NOT NULL COMMENT 'add svce chge',
  `pay_others` varchar(100) NOT NULL COMMENT 'BFL Ins & Others add',
  `pay_advan_install` varchar(50) NOT NULL COMMENT 'add advance emi',
  `pay_rsa_amt` varchar(50) NOT NULL COMMENT 'add rsa amt',
  `pay_ownership_amt` varchar(50) NOT NULL COMMENT 'add ownership amt',
  `pay_bank_transfer` varchar(50) NOT NULL COMMENT 'less bank transfer',
  `pay_swipe_amt` varchar(50) NOT NULL COMMENT 'less swipe amt',
  `pay_special_discnt` varchar(50) NOT NULL COMMENT 'less spl disc amt',
  `pay_fitting_amt` varchar(50) NOT NULL COMMENT 'add fitting amt',
  `pay_others1_amt` varchar(50) NOT NULL COMMENT 'less others1 amt',
  `pay_others2_amt` varchar(50) NOT NULL COMMENT 'less others2 amt',
  `pay_others3_amt` varchar(50) NOT NULL COMMENT 'less others3 amt',
  `pay_gpay` varchar(100) DEFAULT NULL COMMENT 'less gpay amt',
  `pay_add_total` varchar(50) NOT NULL,
  `pay_less_total` varchar(50) NOT NULL,
  `pay_grand_tot` varchar(20) NOT NULL,
  `pay_status` varchar(15) NOT NULL,
  PRIMARY KEY (`payslip_id`)
) ENGINE=MyISAM AUTO_INCREMENT=11487 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_proforma`
--

DROP TABLE IF EXISTS `tbl_proforma`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_proforma` (
  `pro_id` int NOT NULL AUTO_INCREMENT,
  `pro_quot_no` varchar(60) NOT NULL,
  `pro_branch` int NOT NULL,
  `pro_cus_name` varchar(70) NOT NULL,
  `pro_cus_address` text NOT NULL,
  `pro_contact` varchar(15) NOT NULL,
  `pro_ref` varchar(50) NOT NULL,
  `pro_date` date NOT NULL,
  `pro_type_loan` varchar(20) NOT NULL,
  `pro_vehi_tax_total` varchar(50) NOT NULL,
  `pro_vehi_sgst_total` varchar(50) NOT NULL,
  `pro_vehi_cgst_total` varchar(50) NOT NULL,
  `pro_vehi_cess_total` varchar(50) NOT NULL,
  `pro_vehicle_total` varchar(50) NOT NULL,
  `pro_missal1` varchar(70) NOT NULL,
  `pro_missal1_amt` varchar(20) NOT NULL,
  `pro_missal2` varchar(70) NOT NULL,
  `pro_missal2_amt` varchar(20) NOT NULL,
  `pro_less` varchar(20) NOT NULL,
  `pro_grand_total` varchar(30) NOT NULL,
  `pro_status` int NOT NULL,
  `pro_executive` varchar(100) DEFAULT NULL,
  `pro_missal3` varchar(255) DEFAULT NULL,
  `pro_missal3_amt` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (`pro_id`)
) ENGINE=MyISAM AUTO_INCREMENT=3807 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_proforma_item`
--

DROP TABLE IF EXISTS `tbl_proforma_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_proforma_item` (
  `pro_item_id` int NOT NULL AUTO_INCREMENT,
  `proforma_id` int NOT NULL,
  `pro_product_id` int NOT NULL,
  `pro_product_code` varchar(20) NOT NULL,
  `pro_product_descr` text NOT NULL,
  `pro_prduct_bas_amt` varchar(50) NOT NULL,
  `pro_product_qty` int NOT NULL,
  `product_taxable_amt` varchar(50) NOT NULL,
  `pro_product_sgst` varchar(20) NOT NULL,
  `pro_product_cgst` varchar(20) NOT NULL,
  `product_cess_amt` varchar(50) NOT NULL,
  `pro_total` varchar(20) NOT NULL,
  PRIMARY KEY (`pro_item_id`)
) ENGINE=MyISAM AUTO_INCREMENT=4068 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_sale_return`
--

DROP TABLE IF EXISTS `tbl_sale_return`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_sale_return` (
  `inv_id` int NOT NULL AUTO_INCREMENT,
  `inv_no` varchar(500) NOT NULL,
  `inv_cus` varchar(100) NOT NULL,
  `inv_cus_addres` varchar(1000) NOT NULL,
  `inv_pho` varchar(100) NOT NULL,
  `inv_cus_father_hus` varchar(100) DEFAULT NULL,
  `inv_inv_date` date NOT NULL,
  `inv_type` varchar(100) NOT NULL,
  `inv_age` varchar(100) NOT NULL,
  `inv_cdms_no` varchar(50) NOT NULL,
  `inv_area` varchar(100) NOT NULL,
  `inv_hypothication` varchar(100) NOT NULL,
  `inv_chassis` varchar(100) NOT NULL,
  `in_engine` varchar(100) NOT NULL,
  `inv_place` varchar(100) NOT NULL,
  `inv_receipt_no` varchar(100) NOT NULL,
  `inv_regn` varchar(100) NOT NULL,
  `inv_advisername` varchar(100) NOT NULL,
  `inv_finance_dues` varchar(100) DEFAULT NULL,
  `inv_branch` varchar(100) NOT NULL,
  `inv_vehicle` varchar(100) NOT NULL,
  `inv_vehicle_code` varchar(100) NOT NULL,
  `inv_color` varchar(100) NOT NULL,
  `inv_color_code` varchar(100) NOT NULL,
  `inv_total` varchar(100) NOT NULL,
  `inv_product_id` int DEFAULT NULL,
  `status` int NOT NULL DEFAULT '0',
  `inv_gstin` varchar(150) DEFAULT NULL,
  `inv_basic_amt` varchar(150) DEFAULT NULL,
  `inv_discount_amt` varchar(100) DEFAULT NULL,
  `inv_hsncode` varchar(50) DEFAULT NULL,
  `inv_taxable_amt` varchar(100) DEFAULT NULL,
  `inv_sgst` varchar(100) DEFAULT NULL,
  `inv_cgst` varchar(100) DEFAULT NULL,
  `inv_cess` varchar(50) DEFAULT NULL,
  `return_date` date DEFAULT NULL,
  `inv_pincode` varchar(25) DEFAULT NULL,
  PRIMARY KEY (`inv_id`),
  KEY `inv_inv_date` (`inv_inv_date`),
  KEY `inv_branch` (`inv_branch`),
  KEY `status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_stock`
--

DROP TABLE IF EXISTS `tbl_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_stock` (
  `stock_id` int NOT NULL AUTO_INCREMENT,
  `stock_item_id` int NOT NULL,
  `stock_item_code` varchar(50) NOT NULL,
  `stock_item_name` varchar(60) NOT NULL,
  `stock_item_branch` int NOT NULL,
  `stock_qty` varchar(15) NOT NULL,
  `opening_stock` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`stock_id`)
) ENGINE=MyISAM AUTO_INCREMENT=245 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_tax_slab`
--

DROP TABLE IF EXISTS `tbl_tax_slab`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_tax_slab` (
  `id_tax_slab` int NOT NULL AUTO_INCREMENT,
  `GST` decimal(18,2) unsigned DEFAULT '0.00',
  `CGST` decimal(18,2) unsigned DEFAULT '0.00',
  `SGST` decimal(18,2) unsigned DEFAULT '0.00',
  `IGST` decimal(18,2) unsigned DEFAULT '0.00',
  `CESS` decimal(18,2) unsigned DEFAULT '0.00',
  PRIMARY KEY (`id_tax_slab`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_vsi_invoice`
--

DROP TABLE IF EXISTS `tbl_vsi_invoice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_vsi_invoice` (
  `inv_id` int NOT NULL AUTO_INCREMENT,
  `inv_no` varchar(500) NOT NULL,
  `inv_cus` varchar(100) NOT NULL,
  `inv_cus_addres` varchar(100) NOT NULL,
  `inv_pho` varchar(100) NOT NULL,
  `inv_cus_gstin` varchar(100) DEFAULT NULL,
  `inv_inv_date` date NOT NULL,
  `inv_type` varchar(100) NOT NULL,
  `inv_job_card_no` varchar(100) NOT NULL,
  `inv_jcard_date` date NOT NULL,
  `inv_repair_typ` varchar(100) NOT NULL,
  `inv_km` varchar(100) NOT NULL,
  `in_registr` varchar(100) NOT NULL,
  `inv_chassis` varchar(100) NOT NULL,
  `in_engine` varchar(100) NOT NULL,
  `inv_modl` varchar(100) NOT NULL,
  `inv_sale_date` varchar(100) NOT NULL,
  `inv_taxpay` varchar(100) NOT NULL,
  `inv_advisername` varchar(100) NOT NULL,
  `inv_mechna` varchar(100) NOT NULL,
  `inv_branch` varchar(100) NOT NULL,
  `inv_disc_total` varchar(100) NOT NULL,
  `inv_taxtotal` varchar(100) NOT NULL,
  `inv_sgstotal` varchar(100) NOT NULL,
  `inv_gsttotal` varchar(100) NOT NULL,
  `inv_total` varchar(100) NOT NULL,
  `insurance_id` int DEFAULT NULL,
  `insurance_serveyor` varchar(100) DEFAULT NULL,
  `status` int NOT NULL DEFAULT '0' COMMENT '1->cancel bill',
  `ready_status` int NOT NULL DEFAULT '0',
  `inv_cesstotal` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`inv_id`),
  KEY `inv_inv_date` (`inv_inv_date`),
  KEY `inv_repair_typ` (`inv_repair_typ`),
  KEY `inv_branch` (`inv_branch`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_vsi_invoice_cost`
--

DROP TABLE IF EXISTS `tbl_vsi_invoice_cost`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_vsi_invoice_cost` (
  `lc_id` int NOT NULL AUTO_INCREMENT,
  `ic_inv_id` int NOT NULL,
  `lc_lab_code` varchar(100) NOT NULL,
  `lc_type` varchar(100) DEFAULT NULL,
  `lc_lb_name` varchar(100) NOT NULL,
  `lc_sacode` varchar(100) NOT NULL,
  `lc_rate` varchar(100) NOT NULL,
  `lc_disc_p` varchar(100) NOT NULL,
  `lc_disc` varchar(100) NOT NULL DEFAULT '00.00',
  `lc_tax_amunt` varchar(100) NOT NULL,
  `lc_sgst_p` varchar(100) NOT NULL,
  `lc_sgst_a` varchar(100) NOT NULL,
  `lc_cgst_p` varchar(100) NOT NULL,
  `lc_cgst_a` varchar(100) NOT NULL,
  `lc_amount` varchar(100) NOT NULL,
  `lc_cess` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`lc_id`),
  KEY `ic_inv_id` (`ic_inv_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-18 15:14:37
