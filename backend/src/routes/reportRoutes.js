const express = require('express');
const reports = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/monthly', reports.monthlyReport);
router.get('/summary', reports.summaryReport);
router.get('/by-category', reports.byCategoryReport);
router.get('/savings-progress', reports.savingsProgress);

module.exports = router;
