const express = require('express');
const router = express.Router();

const {
    getAvailableChassisRecords,
    getNextInvoiceFromProformaNumber,
    getInvoiceFromProformaExecutives
} = require('../controllers/invoiceFromProformaController');

// Existing route
router.get('/chassis-records', getAvailableChassisRecords);
router.get('/executives', getInvoiceFromProformaExecutives);

// ✅ New route for next invoice number
router.get(
    '/next-number',
    getNextInvoiceFromProformaNumber
);

module.exports = router;