const express = require('express');
const income = require('../controllers/incomeController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All income routes require authentication.
router.use(authMiddleware);

router.get('/summary', income.incomeSummary);
router.get('/', income.listIncome);
router.post('/', income.createIncome);
router.put('/:id', income.updateIncome);
router.delete('/:id', income.deleteIncome);

module.exports = router;
