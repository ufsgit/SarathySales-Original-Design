const express = require('express');
const router = express.Router();
const { getNextReceiptNo, listReceipts, saveReceipt, getReceipt, updateReceipt, deleteReceipt, createMoneyReceiptPdf } = require('../controllers/moneyReceiptController');

router.get('/next-no', getNextReceiptNo);
router.get('/list', listReceipts);
router.post('/save', saveReceipt);
router.get('/pdf/:id', createMoneyReceiptPdf);
router.get('/:id', getReceipt);
router.put('/:id', updateReceipt);
router.delete('/:id', deleteReceipt);

module.exports = router;
