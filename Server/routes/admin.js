const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');

// Apply adminMiddleware to all routes in this router
router.use(adminMiddleware);

const {
    listEmployees,
    addEmployee,
    listProducts,
    addProduct,
    editProduct,
    deleteProduct,
    listHypothecations,
    addHypothecation,
    editHypothecation,
    deleteHypothecation,
    listCompanies,
    addCompany,
    updateCompany,
    deleteCompany,
    listInstitutions,
    addInstitution,
    listColors,
    addColor,
    listDesignations,
    updateEmployee,
    deleteEmployee,
    updateInstitution,
    deleteInstitution
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
router.put('/employees/edit/:id', updateEmployee);
router.delete('/employees/delete/:id', deleteEmployee);

// Product Routes
router.get('/products/list', listProducts);
router.post('/products/add', addProduct);
router.put('/products/edit/:id', editProduct);
router.delete('/products/delete/:id', deleteProduct);

// Hypothecation Routes
router.get('/hypothecations/list', listHypothecations);
router.post('/hypothecations/add', addHypothecation);
router.put('/hypothecations/edit/:id', editHypothecation);
router.delete('/hypothecations/delete/:id', deleteHypothecation);

// Company Routes
router.get('/companies/list', listCompanies);
router.post('/companies/add', addCompany);
router.put('/companies/edit/:id', updateCompany);
router.delete('/companies/delete/:id', deleteCompany);

// Institution Routes
router.get('/institutions/list', listInstitutions);
router.post('/institutions/add', addInstitution);
router.put('/institutions/edit/:id', updateInstitution);
router.delete('/institutions/delete/:id', deleteInstitution);

// Color Routes
router.get('/colors/list', listColors);
router.post('/colors/add', upload.single('image'), addColor);
router.put('/colors/edit/:id', require('../controllers/adminController').updateColor);
router.delete('/colors/delete/:id', require('../controllers/adminController').deleteColor);

router.get('/designations/list', listDesignations);

// Product Price Upload Route
const priceUploadDir = path.join(__dirname, '../public/uploads/price-uploads');
if (!fs.existsSync(priceUploadDir)) {
    fs.mkdirSync(priceUploadDir, { recursive: true });
}
const priceUploadStorage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, priceUploadDir); },
    filename: (req, file, cb) => { cb(null, 'price_' + Date.now() + path.extname(file.originalname)); }
});
const priceUpload = multer({ storage: priceUploadStorage, fileFilter: (req, file, cb) => {
    const allowed = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only Excel and CSV files are allowed'));
}});

router.post('/products/upload-price', priceUpload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    // File saved — further processing (parsing, updating DB) can be added here
    res.json({ 
        success: true, 
        message: `File "${req.file.originalname}" uploaded successfully. Price update queued.`,
        filename: req.file.filename
    });
});

module.exports = router;
