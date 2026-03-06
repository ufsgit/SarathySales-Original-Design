const express = require('express');
const router = express.Router();
const { getNextReceiptNo, listReceipts, saveReceipt, getReceipt, updateReceipt } = require('../controllers/moneyReceiptController');

router.get('/next-no', getNextReceiptNo);
router.get('/list', listReceipts);
router.post('/save', saveReceipt);
router.get('/:id', getReceipt);
router.put('/:id', updateReceipt);

module.exports = router;
