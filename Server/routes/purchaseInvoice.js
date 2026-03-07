const express = require('express');
const router = express.Router();
const {
    listPurchaseInvoices,
    getPurchaseInvoice,
    savePurchaseInvoice,
    createPurchasePdf,
    createPurchasePdfByNo,
    getModelColors
} = require('../controllers/purchaseInvoiceController');

router.get('/list', listPurchaseInvoices);
router.get('/model-colors', getModelColors);
router.post('/save', savePurchaseInvoice);
router.get('/create-pdf/:id', createPurchasePdf);
router.get('/pdf-by-no/:no', createPurchasePdfByNo);
router.get('/:id', getPurchaseInvoice);

module.exports = router;
