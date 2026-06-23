const db = require('../models/db');
const { EXPENSE_CATEGORIES } = require('../models/constants');
const { parsePositiveAmount, parseIntInRange, httpError } = require('../models/validators');

function assertValidCategory(category) {
  if (!category || !EXPENSE_CATEGORIES.includes(category)) {
    throw httpError(`category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`);
  }
}

function currentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

/**
 * Compute amount spent for a category in a month/year for a user.
 */
function spentForCategory(userId, category, month, year) {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS spent FROM expenses
       WHERE user_id = ? AND category = ?
         AND CAST(strftime('%m', date) AS INTEGER) = ?
         AND CAST(strftime('%Y', date) AS INTEGER) = ?`
    )
    .get(userId, category, month, year);
  return row.spent;
}

/**
 * POST /api/budgets
 */
function createBudget(req, res, next) {
  try {
    const { category, month, year, limit_amount } = req.body || {};
    assertValidCategory(category);
    const validMonth = parseIntInRange(month, 'month', 1, 12);
    const validYear = parseIntInRange(year, 'year', 1900, 3000);
    const validLimit = parsePositiveAmount(limit_amount, 'limit_amount');

    const existing = db
      .prepare(
        'SELECT id FROM budgets WHERE user_id = ? AND category = ? AND month = ? AND year = ?'
      )
      .get(req.user.id, category, validMonth, validYear);
    if (existing) {
      throw httpError('A budget for that category and month already exists', 409);
    }

    const info = db
      .prepare(
        'INSERT INTO budgets (user_id, category, month, year, limit_amount) VALUES (?, ?, ?, ?, ?)'
      )
      .run(req.user.id, category, validMonth, validYear, validLimit);

    const record = db.prepare('SELECT * FROM budgets WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ budget: record });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/budgets — list budgets for the current month (or supplied month/year).
 */
function listBudgets(req, res, next) {
  try {
    const def = currentMonthYear();
    const month = req.query.month ? parseIntInRange(req.query.month, 'month', 1, 12) : def.month;
    const year = req.query.year ? parseIntInRange(req.query.year, 'year', 1900, 3000) : def.year;

    const rows = db
      .prepare('SELECT * FROM budgets WHERE user_id = ? AND month = ? AND year = ? ORDER BY category')
      .all(req.user.id, month, year);
    res.json({ budgets: rows, month, year });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/budgets/status — progress info for each budget in a month.
 */
function budgetStatus(req, res, next) {
  try {
    const def = currentMonthYear();
    const month = req.query.month ? parseIntInRange(req.query.month, 'month', 1, 12) : def.month;
    const year = req.query.year ? parseIntInRange(req.query.year, 'year', 1900, 3000) : def.year;

    const budgets = db
      .prepare('SELECT * FROM budgets WHERE user_id = ? AND month = ? AND year = ? ORDER BY category')
      .all(req.user.id, month, year);

    const statuses = budgets.map((b) => {
      const spent = spentForCategory(req.user.id, b.category, month, year);
      const remaining = b.limit_amount - spent;
      const percentUsed = b.limit_amount > 0 ? (spent / b.limit_amount) * 100 : 0;
      return {
        id: b.id,
        category: b.category,
        month: b.month,
        year: b.year,
        limit_amount: b.limit_amount,
        amount_spent: spent,
        amount_remaining: remaining,
        percent_used: Number(percentUsed.toFixed(2)),
        is_exceeded: spent > b.limit_amount,
      };
    });

    res.json({ status: statuses, month, year });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/budgets/:id
 */
function updateBudget(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = db
      .prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?')
      .get(id, req.user.id);
    if (!existing) throw httpError('Budget not found', 404);

    const { category, month, year, limit_amount } = req.body || {};

    let newCategory = existing.category;
    if (category !== undefined) {
      assertValidCategory(category);
      newCategory = category;
    }
    const newMonth = month !== undefined ? parseIntInRange(month, 'month', 1, 12) : existing.month;
    const newYear = year !== undefined ? parseIntInRange(year, 'year', 1900, 3000) : existing.year;
    const newLimit =
      limit_amount !== undefined ? parsePositiveAmount(limit_amount, 'limit_amount') : existing.limit_amount;

    // Guard against violating the unique (user, category, month, year) constraint.
    const clash = db
      .prepare(
        'SELECT id FROM budgets WHERE user_id = ? AND category = ? AND month = ? AND year = ? AND id != ?'
      )
      .get(req.user.id, newCategory, newMonth, newYear, id);
    if (clash) {
      throw httpError('A budget for that category and month already exists', 409);
    }

    db.prepare(
      'UPDATE budgets SET category = ?, month = ?, year = ?, limit_amount = ? WHERE id = ?'
    ).run(newCategory, newMonth, newYear, newLimit, id);

    const updated = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);
    res.json({ budget: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/budgets/:id
 */
function deleteBudget(req, res, next) {
  try {
    const id = Number(req.params.id);
    const info = db.prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?').run(id, req.user.id);
    if (info.changes === 0) throw httpError('Budget not found', 404);
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createBudget,
  listBudgets,
  budgetStatus,
  updateBudget,
  deleteBudget,
};
