const express = require('express');
const router = express.Router();
const { listBranches } = require('../controllers/branchController');

router.get('/list', listBranches);

module.exports = router;
