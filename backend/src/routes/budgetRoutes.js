const express = require('express');
const budgets = require('../controllers/budgetController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/status', budgets.budgetStatus);
router.get('/', budgets.listBudgets);
router.post('/', budgets.createBudget);
router.put('/:id', budgets.updateBudget);
router.delete('/:id', budgets.deleteBudget);

module.exports = router;
