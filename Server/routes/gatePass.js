const express = require('express');
const router = express.Router();
const {
    getNextGatePassNo,
    getGatePassInvoices,
    getGatePassInvoiceDetails,
    listGatePasses,
    saveGatePass,
    getGatePass,
    updateGatePass
} = require('../controllers/gatePassController');

router.get('/next-no', getNextGatePassNo);
router.get('/invoices', getGatePassInvoices);
router.get('/invoice-details', getGatePassInvoiceDetails);
router.get('/list', listGatePasses);
router.post('/save', saveGatePass);
router.get('/:id', getGatePass);
router.put('/:id', updateGatePass);

module.exports = router;
