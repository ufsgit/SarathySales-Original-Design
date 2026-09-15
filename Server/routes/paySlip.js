const express = require('express');
const router = express.Router();
const {
    getNextPaySlipNo,
    getAdvisers,
    getPaySlipFormData,
    listPaySlips,
    savePaySlip,
    updatePaySlip,
    getPaySlip,
    deletePaySlip,
    hardDeletePaySlip,
    createPdf,
    createPdfByNo
} = require('../controllers/paySlipController');

router.get('/next-no', getNextPaySlipNo);
router.get('/advisers', getAdvisers);
router.get('/form-data', getPaySlipFormData);
router.get('/list', listPaySlips);
router.post('/save', savePaySlip);
router.put('/:id', updatePaySlip);
router.get('/:id', getPaySlip);
router.delete('/hard-delete/:id', hardDeletePaySlip);
router.delete('/:id', deletePaySlip);
router.get('/create-pdf/:id', createPdf);
router.get('/pdf-by-no/:no', createPdfByNo);

module.exports = router;
