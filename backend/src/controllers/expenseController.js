const db = require('../models/db');
const { EXPENSE_CATEGORIES } = require('../models/constants');
const { parsePositiveAmount, isValidDate, httpError } = require('../models/validators');

function assertValidCategory(category) {
  if (!category || !EXPENSE_CATEGORIES.includes(category)) {
    throw httpError(`category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`);
  }
}

/**
 * Given a date string (YYYY-MM-DD), return its month/year as integers.
 */
function monthYearFromDate(date) {
  const [y, m] = date.split('-').map(Number);
  return { month: m, year: y };
}

/**
 * Check whether the total spending for a category in a given month/year
 * exceeds the user's budget for that category. Returns a warning object or null.
 */
function checkBudgetWarning(userId, category, month, year) {
  const budget = db
    .prepare(
      'SELECT * FROM budgets WHERE user_id = ? AND category = ? AND month = ? AND year = ?'
    )
    .get(userId, category, month, year);

  if (!budget) return null;

  const spentRow = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS spent FROM expenses
       WHERE user_id = ? AND category = ?
         AND CAST(strftime('%m', date) AS INTEGER) = ?
         AND CAST(strftime('%Y', date) AS INTEGER) = ?`
    )
    .get(userId, category, month, year);

  const spent = spentRow.spent;
  if (spent > budget.limit_amount) {
    return {
      category,
      limit_amount: budget.limit_amount,
      amount_spent: spent,
      amount_over: spent - budget.limit_amount,
      message: `Budget exceeded for ${category}: spent ${spent.toFixed(2)} of ${budget.limit_amount.toFixed(2)}`,
    };
  }
  return null;
}

/**
 * GET /api/expenses/categories
 */
function listCategories(req, res) {
  res.json({ categories: EXPENSE_CATEGORIES });
}

/**
 * POST /api/expenses
 */
function createExpense(req, res, next) {
  try {
    const { amount, category, description, date } = req.body || {};
    const validAmount = parsePositiveAmount(amount, 'amount');
    assertValidCategory(category);
    if (!isValidDate(date)) {
      throw httpError('date is required and must be a valid YYYY-MM-DD date');
    }

    const info = db
      .prepare(
        'INSERT INTO expenses (user_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?)'
      )
      .run(req.user.id, validAmount, category, description ? String(description) : null, date);

    const record = db.prepare('SELECT * FROM expenses WHERE id = ?').get(info.lastInsertRowid);

    const { month, year } = monthYearFromDate(date);
    const warning = checkBudgetWarning(req.user.id, category, month, year);

    res.status(201).json({ expense: record, warning });
  } catch (err) {
    next(err);
  }
}

/**
 * Build a WHERE clause for listing expenses with optional
 * category, month, year, and date range (startDate/endDate) filters.
 */
function buildExpenseFilter(userId, query) {
  const conditions = ['user_id = ?'];
  const params = [userId];

  if (query.category !== undefined && query.category !== '') {
    assertValidCategory(query.category);
    conditions.push('category = ?');
    params.push(query.category);
  }

  if (query.month !== undefined && query.month !== '') {
    const month = Number(query.month);
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw httpError('month must be an integer between 1 and 12');
    }
    conditions.push("CAST(strftime('%m', date) AS INTEGER) = ?");
    params.push(month);
  }

  if (query.year !== undefined && query.year !== '') {
    const year = Number(query.year);
    if (!Number.isInteger(year) || year < 1900 || year > 3000) {
      throw httpError('year must be a valid 4-digit year');
    }
    conditions.push("CAST(strftime('%Y', date) AS INTEGER) = ?");
    params.push(year);
  }

  if (query.startDate !== undefined && query.startDate !== '') {
    if (!isValidDate(query.startDate)) throw httpError('startDate must be a valid YYYY-MM-DD date');
    conditions.push('date >= ?');
    params.push(query.startDate);
  }

  if (query.endDate !== undefined && query.endDate !== '') {
    if (!isValidDate(query.endDate)) throw httpError('endDate must be a valid YYYY-MM-DD date');
    conditions.push('date <= ?');
    params.push(query.endDate);
  }

  return { clause: conditions.join(' AND '), params };
}

/**
 * GET /api/expenses — list (filterable by category, month, date range)
 */
function listExpenses(req, res, next) {
  try {
    const { clause, params } = buildExpenseFilter(req.user.id, req.query);
    const rows = db
      .prepare(`SELECT * FROM expenses WHERE ${clause} ORDER BY date DESC, id DESC`)
      .all(...params);
    res.json({ expenses: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/expenses/:id
 */
function updateExpense(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = db
      .prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?')
      .get(id, req.user.id);
    if (!existing) throw httpError('Expense record not found', 404);

    const { amount, category, description, date } = req.body || {};

    const newAmount = amount !== undefined ? parsePositiveAmount(amount, 'amount') : existing.amount;

    let newCategory = existing.category;
    if (category !== undefined) {
      assertValidCategory(category);
      newCategory = category;
    }

    let newDate = existing.date;
    if (date !== undefined) {
      if (!isValidDate(date)) throw httpError('date must be a valid YYYY-MM-DD date');
      newDate = date;
    }

    const newDescription =
      description !== undefined ? (description ? String(description) : null) : existing.description;

    db.prepare(
      'UPDATE expenses SET amount = ?, category = ?, description = ?, date = ? WHERE id = ?'
    ).run(newAmount, newCategory, newDescription, newDate, id);

    const updated = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);

    const { month, year } = monthYearFromDate(newDate);
    const warning = checkBudgetWarning(req.user.id, newCategory, month, year);

    res.json({ expense: updated, warning });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/expenses/:id
 */
function deleteExpense(req, res, next) {
  try {
    const id = Number(req.params.id);
    const info = db
      .prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?')
      .run(id, req.user.id);
    if (info.changes === 0) throw httpError('Expense record not found', 404);
    res.json({ message: 'Expense record deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCategories,
  createExpense,
  listExpenses,
  updateExpense,
  deleteExpense,
  checkBudgetWarning,
};
