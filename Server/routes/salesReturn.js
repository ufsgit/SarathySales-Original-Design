const express = require('express');
const router = express.Router();
const salesReturnController = require('../controllers/salesReturnController');

router.get('/list', salesReturnController.getSalesReturnReport);

module.exports = router;
