const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');

// Apply adminMiddleware selectively to sensitive/mutation routes
// router.use(adminMiddleware); // REMOVED GLOBAL APPLICATION

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
    deleteInstitution,
    listTaxSlabs,
    addTaxSlab,
    updateTaxSlab,
    deleteTaxSlab,
    checkTaxSlabDependencies
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

// Employee Routes (Strictly ADMIN)
router.get('/employees/list', adminMiddleware, listEmployees);
router.post('/employees/add', adminMiddleware, addEmployee);
router.put('/employees/edit/:id', adminMiddleware, updateEmployee);
router.delete('/employees/delete/:id', adminMiddleware, deleteEmployee);

// Product Routes
router.get('/products/list', listProducts); // Open to all authenticated
router.post('/products/add', adminMiddleware, addProduct);
router.put('/products/edit/:id', adminMiddleware, editProduct);
router.delete('/products/delete/:id', adminMiddleware, deleteProduct);

// Hypothecation Routes
router.get('/hypothecations/list', listHypothecations); // Open
router.post('/hypothecations/add', adminMiddleware, addHypothecation);
router.put('/hypothecations/edit/:id', adminMiddleware, editHypothecation);
router.delete('/hypothecations/delete/:id', adminMiddleware, deleteHypothecation);

// Company Routes
router.get('/companies/list', listCompanies); // Open
router.post('/companies/add', adminMiddleware, addCompany);
router.put('/companies/edit/:id', adminMiddleware, updateCompany);
router.delete('/companies/delete/:id', adminMiddleware, deleteCompany);

// Institution Routes
router.get('/institutions/list', listInstitutions); // Open
router.post('/institutions/add', adminMiddleware, addInstitution);
router.put('/institutions/edit/:id', adminMiddleware, updateInstitution);
router.delete('/institutions/delete/:id', adminMiddleware, deleteInstitution);

// Color Routes
router.get('/colors/list', listColors); // Open
router.post('/colors/add', adminMiddleware, upload.single('image'), addColor);
router.put('/colors/edit/:id', adminMiddleware, require('../controllers/adminController').updateColor);
router.delete('/colors/delete/:id', adminMiddleware, require('../controllers/adminController').deleteColor);

router.get('/designations/list', listDesignations); // Open

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

const { uploadProductPrice } = require('../controllers/adminController');
router.post('/products/upload-price', adminMiddleware, priceUpload.single('file'), uploadProductPrice);

// Tax Master Routes
router.get('/tax-slabs/list', listTaxSlabs); // Open
router.post('/tax-slabs/add', adminMiddleware, addTaxSlab);
router.put('/tax-slabs/update/:id', adminMiddleware, updateTaxSlab);
router.delete('/tax-slabs/delete/:id', adminMiddleware, deleteTaxSlab);
router.get('/tax-slabs/check-dependencies/:id', adminMiddleware, checkTaxSlabDependencies);

module.exports = router;
