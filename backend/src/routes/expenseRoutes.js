const express = require('express');
const expenses = require('../controllers/expenseController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/categories', expenses.listCategories);
router.get('/', expenses.listExpenses);
router.post('/', expenses.createExpense);
router.put('/:id', expenses.updateExpense);
router.delete('/:id', expenses.deleteExpense);

module.exports = router;
