const express = require('express');
const router = express.Router();
const { searchCustomers, addCustomer, listCustomers, checkChassisUnique, checkEngineUnique } = require('../controllers/customerController');

router.get('/search', searchCustomers);
router.get('/list', listCustomers);
router.post('/add', addCustomer);
router.get('/check-chassis', checkChassisUnique);
router.get('/check-engine', checkEngineUnique);

module.exports = router;
