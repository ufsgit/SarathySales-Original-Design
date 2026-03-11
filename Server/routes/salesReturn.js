const express = require('express');
const router = express.Router();
const salesReturnController = require('../controllers/salesReturnController');

router.get('/list', salesReturnController.getSalesReturnReport);
router.get('/pdf/:id', salesReturnController.createSalesReturnPdf);

module.exports = router;
