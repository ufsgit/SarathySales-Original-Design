const express = require('express');
const router = express.Router();
const { searchVehicles, listModels, getVehicleByChassisNo, listChassis, createStickerPdf, createSaleLetterPdf, createPrintEnquiryPdf } = require('../controllers/vehicleEnquiryController');

router.get('/search', searchVehicles);
router.get('/models', listModels);
router.get('/chassis-list', listChassis);
router.get('/chassis/:chassisNo', getVehicleByChassisNo);
router.get('/sticker/:chassisNo', createStickerPdf);
router.get('/sale-letter/:chassisNo', createSaleLetterPdf);
router.get('/print-enquiry/:chassisNo', createPrintEnquiryPdf);

module.exports = router;
