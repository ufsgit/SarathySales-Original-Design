const express = require('express');
const router = express.Router();
const { 
    getStockList, 
    getAvailableVehicles, 
    getStockVerification, 
    getStockVerificationAll,
    getStockSplitup, 
    getStockSplitupAll,
    updateStock, 
    exportStockVerificationExcel,
    exportStockVerificationPagedExcel,
    exportStockVerificationPagedCsv
} = require('../controllers/stockController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directory for stock images
const uploadDir = path.join(__dirname, '../public/uploads/stock');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, 'stock_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

router.get('/list', getStockList);
router.get('/available', getAvailableVehicles);
router.get('/report/verification', getStockVerification);
router.get('/report/verification/all', getStockVerificationAll);
router.get('/report/verification/excel', exportStockVerificationExcel);
router.get('/report/verification/all/excel', require('../controllers/stockController').exportStockVerificationAllExcel);
router.get('/report/verification/paged-excel', exportStockVerificationPagedExcel);
router.get('/report/verification/all/paged-excel', require('../controllers/stockController').exportStockVerificationAllPagedExcel);
router.get('/report/verification/paged-csv', exportStockVerificationPagedCsv);
router.get('/report/verification/all/paged-csv', require('../controllers/stockController').exportStockVerificationAllPagedCsv);
router.get('/report/splitup', getStockSplitup);
router.get('/report/splitup/all', getStockSplitupAll);
router.get('/report/splitup/excel', require('../controllers/stockController').exportStockSplitupExcel);
router.get('/report/splitup/all/excel', require('../controllers/stockController').exportStockSplitupAllExcel);
router.get('/report/splitup/paged-excel', require('../controllers/stockController').exportStockSplitupPagedExcel);
router.get('/report/splitup/all/paged-excel', require('../controllers/stockController').exportStockSplitupAllPagedExcel);
router.get('/report/splitup/paged-csv', require('../controllers/stockController').exportStockSplitupPagedCsv);
router.get('/report/splitup/all/paged-csv', require('../controllers/stockController').exportStockSplitupAllPagedCsv);

router.post('/update', upload.single('image'), updateStock);
router.delete('/delete/:id', require('../controllers/stockController').deleteStock);
module.exports = router;
