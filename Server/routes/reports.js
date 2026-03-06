const express = require('express');
const router = express.Router();
const { getSalesReport, getPurchaseReport, getMoneyReceiptReport, getPaySlipReport,
    getBranchTransferReport, getProformaReport, getVsiReport,
    exportProformaExcel, exportProformaPagedExcel, exportProformaPagedCsv,
    exportSalesExcel, exportSalesPagedExcel, exportSalesPagedCsv,
    exportPurchaseExcel, exportPurchasePagedExcel, exportPurchasePagedCsv,
    exportPayslipExcel, exportPayslipPagedExcel, exportPayslipPagedCsv,
    exportMoneyReceiptExcel, exportMoneyReceiptPagedExcel, exportMoneyReceiptPagedCsv,
    exportBranchTransferExcel, exportBranchTransferPagedExcel, exportBranchTransferPagedCsv } = require('../controllers/reportsController');

router.get('/sales', getSalesReport);
router.get('/sales/excel', exportSalesExcel);
router.get('/sales/paged-excel', exportSalesPagedExcel);
router.get('/sales/paged-csv', exportSalesPagedCsv);
router.get('/purchase', getPurchaseReport);
router.get('/purchase/excel', exportPurchaseExcel);
router.get('/purchase/paged-excel', exportPurchasePagedExcel);
router.get('/purchase/paged-csv', exportPurchasePagedCsv);
router.get('/money-receipt', getMoneyReceiptReport);
router.get('/money-receipt/excel', exportMoneyReceiptExcel);
router.get('/money-receipt/paged-excel', exportMoneyReceiptPagedExcel);
router.get('/money-receipt/paged-csv', exportMoneyReceiptPagedCsv);
router.get('/pay-slip', getPaySlipReport);
router.get('/payslip/excel', exportPayslipExcel);
router.get('/payslip/paged-excel', exportPayslipPagedExcel);
router.get('/payslip/paged-csv', exportPayslipPagedCsv);
router.get('/branch-transfer', getBranchTransferReport);
router.get('/branch-transfer/excel', exportBranchTransferExcel);
router.get('/branch-transfer/paged-excel', exportBranchTransferPagedExcel);
router.get('/branch-transfer/paged-csv', exportBranchTransferPagedCsv);
router.get('/proforma', getProformaReport);
router.get('/proforma/excel', exportProformaExcel);
router.get('/proforma/paged-excel', exportProformaPagedExcel);
router.get('/proforma/paged-csv', exportProformaPagedCsv);
router.get('/vsi', getVsiReport);

module.exports = router;
