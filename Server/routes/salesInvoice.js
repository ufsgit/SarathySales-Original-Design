const express = require('express');
const router = express.Router();
const {
    getNextInvoiceNo,
    getAllLabourCodes,
    getLabourDetails,
    getHypothecationOptions,
    getChassisRecords,
    listInvoices,
    createSalesPdf,
    createSalesLetterPdf,
    createStickerPdf,
    createRtoBillPdf,
    createSalesPdfByNo,
    createSalesLetterPdfByNo,
    createStickerPdfByNo,
    createRtoBillPdfByNo,
    getSalesExecutives,
    saveInvoice,
    updateInvoice
} = require('../controllers/salesInvoiceController');

router.get('/next-no', getNextInvoiceNo);
router.get('/labour-codes', getAllLabourCodes);
router.get('/labour-details/:labourId', getLabourDetails);
router.get('/hypothecation-options', getHypothecationOptions);
router.get('/chassis-records', getChassisRecords);
router.get('/list', listInvoices);
router.get('/pdf/:id', createSalesPdf);
router.get('/pdf/sales-letter/:id', createSalesLetterPdf);
router.get('/pdf/sticker/:id', createStickerPdf);
router.get('/pdf/rto-bill/:id', createRtoBillPdf);
router.get('/pdf-by-no/:no', createSalesPdfByNo);
router.get('/pdf-by-no/sales-letter/:no', createSalesLetterPdfByNo);
router.get('/pdf-by-no/sticker/:no', createStickerPdfByNo);
router.get('/pdf-by-no/rto-bill/:no', createRtoBillPdfByNo);
router.get('/executives', getSalesExecutives);
router.post('/save', saveInvoice);
router.put('/:id', updateInvoice);

module.exports = router;
