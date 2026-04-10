const express = require('express');
const router = express.Router();
const {
    getNextBranchTransferNo,
    getAvailableStock,
    getInstitutionCustomerName,
    listBranchTransfers,
    getBranchTransfer,
    saveBranchTransfer,
    updateBranchTransfer,
    createBranchTransferPdf,
    createBranchTransferPdfByNo
} = require('../controllers/branchTransferController');

router.get('/next-no', getNextBranchTransferNo);
router.get('/available-stock', getAvailableStock);
router.get('/institution-name', getInstitutionCustomerName);
router.get('/list', listBranchTransfers);
router.post('/save', saveBranchTransfer);
router.put('/:id', updateBranchTransfer);
router.get('/create-pdf/:id', createBranchTransferPdf);
router.get('/pdf-by-no/:no', createBranchTransferPdfByNo);
router.get('/:id', getBranchTransfer);

module.exports = router;
