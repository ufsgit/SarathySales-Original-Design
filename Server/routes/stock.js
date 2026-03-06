const express = require('express');
const router = express.Router();
const { getStockList, getAvailableVehicles, getStockVerification, getStockSplitup } = require('../controllers/stockController');

router.get('/list', getStockList);
router.get('/available', getAvailableVehicles);
router.get('/report/verification', getStockVerification);
router.get('/report/splitup', getStockSplitup);

module.exports = router;
