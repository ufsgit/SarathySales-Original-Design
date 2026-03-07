const express = require('express');
const router = express.Router();
const { searchVehicles, listModels, getVehicleByChassisNo, listChassis, createStickerPdf, createSaleLetterPdf, createPrintEnquiryPdf } = require('../controllers/vehicleEnquiryController');

router.get('/search', searchVehicles);
router.get('/models', listModels);
router.get('/chassis-list', listChassis);
router.get('/chassis/:chassisNo', getVehicleByChassisNo);
router.get('/pdf/sticker/:chassisNo', createStickerPdf);
router.get('/pdf/sale-letter/:chassisNo', createSaleLetterPdf);
router.get('/pdf/print-enquiry/:chassisNo', createPrintEnquiryPdf);

module.exports = router;
