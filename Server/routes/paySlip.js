const express = require('express');
const router = express.Router();
const {
    getNextPaySlipNo,
    getAdvisers,
    getPaySlipFormData,
    listPaySlips,
    savePaySlip,
    getPaySlip,
    updatePaySlip,
    createPdf
} = require('../controllers/paySlipController');

router.get('/next-no', getNextPaySlipNo);
router.get('/advisers', getAdvisers);
router.get('/form-data', getPaySlipFormData);
router.get('/list', listPaySlips);
router.post('/save', savePaySlip);
router.get('/create-pdf/:id', createPdf);
router.get('/:id', getPaySlip);
router.put('/:id', updatePaySlip);

module.exports = router;
