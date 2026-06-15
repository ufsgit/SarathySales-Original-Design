const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');

const {
    upload,
    listLogos,
    getLogoById,
    createLogo,
    updateLogo,
    updateLogoWithImage,
    deleteLogo
} = require('../controllers/logo.controller');

// Logo routes
router.get('/list', listLogos);
router.get('/get/:id', getLogoById);
router.post('/create', adminMiddleware, upload.single('logo_image'), createLogo);
router.put('/update/:id', adminMiddleware, updateLogo);
router.put('/update-with-image/:id', adminMiddleware, upload.single('logo_image'), updateLogoWithImage);
router.delete('/delete/:id', adminMiddleware, deleteLogo);

module.exports = router;
