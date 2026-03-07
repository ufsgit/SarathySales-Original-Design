const express = require('express');
const router = express.Router();
const { getNextProformaNo, listProformas, getProforma, saveProforma, updateProforma, createProformaPdf, createProformaPdfByNo, getProformaExecutives } = require('../controllers/proformaController');

router.get('/next-no', getNextProformaNo);
router.get('/executives', getProformaExecutives);
router.get('/list', listProformas);
router.post('/save', saveProforma);
router.get('/create-pdf/:id', createProformaPdf);
router.get('/pdf-by-no/:no', createProformaPdfByNo);
router.get('/:id', getProforma);
router.put('/:id', updateProforma);

module.exports = router;
