const express = require('express');
const router = express.Router();
const { getStockList, getAvailableVehicles, getStockVerification, getStockSplitup, updateStock } = require('../controllers/stockController');
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
router.get('/report/splitup', getStockSplitup);
router.post('/update', upload.single('image'), updateStock);
router.delete('/delete/:id', require('../controllers/stockController').deleteStock);

module.exports = router;
