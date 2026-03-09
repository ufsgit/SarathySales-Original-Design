const express = require('express');
const router = express.Router();
const {
    listEmployees,
    addEmployee,
    listProducts,
    addProduct,
    listHypothecations,
    addHypothecation,
    listCompanies,
    addCompany,
    listInstitutions,
    addInstitution,
    listColors,
    addColor
} = require('../controllers/adminController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directory for colors
const uploadDir = path.join(__dirname, '../public/uploads/colors');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, 'color_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Employee Routes
router.get('/employees/list', listEmployees);
router.post('/employees/add', addEmployee);

// Product Routes
router.get('/products/list', listProducts);
router.post('/products/add', addProduct);

// Hypothecation Routes
router.get('/hypothecations/list', listHypothecations);
router.post('/hypothecations/add', addHypothecation);

// Company Routes
router.get('/companies/list', listCompanies);
router.post('/companies/add', addCompany);

// Institution Routes
router.get('/institutions/list', listInstitutions);
router.post('/institutions/add', addInstitution);

// Color Routes
router.get('/colors/list', listColors);
router.post('/colors/add', upload.single('image'), addColor);

module.exports = router;
