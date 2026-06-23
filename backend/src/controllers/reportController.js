const db = require('../models/db');
const { parseIntInRange } = require('../models/validators');

function currentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

function totalIncomeForPeriod(userId, month, year) {
  return db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM income
       WHERE user_id = ?
         AND CAST(strftime('%m', date) AS INTEGER) = ?
         AND CAST(strftime('%Y', date) AS INTEGER) = ?`
    )
    .get(userId, month, year).total;
}

function totalExpensesForPeriod(userId, month, year) {
  return db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses
       WHERE user_id = ?
         AND CAST(strftime('%m', date) AS INTEGER) = ?
         AND CAST(strftime('%Y', date) AS INTEGER) = ?`
    )
    .get(userId, month, year).total;
}

/**
 * GET /api/reports/monthly — income, expenses, net savings for a month.
 */
function monthlyReport(req, res, next) {
  try {
    const def = currentMonthYear();
    const month = req.query.month ? parseIntInRange(req.query.month, 'month', 1, 12) : def.month;
    const year = req.query.year ? parseIntInRange(req.query.year, 'year', 1900, 3000) : def.year;

    const totalIncome = totalIncomeForPeriod(req.user.id, month, year);
    const totalExpenses = totalExpensesForPeriod(req.user.id, month, year);

    res.json({
      month,
      year,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_savings: totalIncome - totalExpenses,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reports/summary — overall totals across all time.
 */
function summaryReport(req, res, next) {
  try {
    const totalIncome = db
      .prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM income WHERE user_id = ?')
      .get(req.user.id).total;
    const totalExpenses = db
      .prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE user_id = ?')
      .get(req.user.id).total;

    res.json({
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_savings: totalIncome - totalExpenses,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reports/by-category — total spending per category for a month.
 */
function byCategoryReport(req, res, next) {
  try {
    const def = currentMonthYear();
    const month = req.query.month ? parseIntInRange(req.query.month, 'month', 1, 12) : def.month;
    const year = req.query.year ? parseIntInRange(req.query.year, 'year', 1900, 3000) : def.year;

    const rows = db
      .prepare(
        `SELECT category, COALESCE(SUM(amount), 0) AS total FROM expenses
         WHERE user_id = ?
           AND CAST(strftime('%m', date) AS INTEGER) = ?
           AND CAST(strftime('%Y', date) AS INTEGER) = ?
         GROUP BY category
         ORDER BY total DESC`
      )
      .all(req.user.id, month, year);

    res.json({ month, year, by_category: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reports/savings-progress — monthly savings over the last 6 months.
 */
function savingsProgress(req, res, next) {
  try {
    const result = [];
    const now = new Date();
    // Anchor at the first of the current month to avoid day-overflow issues.
    const anchor = new Date(now.getFullYear(), now.getMonth(), 1);

    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const income = totalIncomeForPeriod(req.user.id, month, year);
      const expenses = totalExpensesForPeriod(req.user.id, month, year);
      result.push({
        month,
        year,
        label: `${String(month).padStart(2, '0')}/${year}`,
        total_income: income,
        total_expenses: expenses,
        savings: income - expenses,
      });
    }

    res.json({ savings_progress: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  monthlyReport,
  summaryReport,
  byCategoryReport,
  savingsProgress,
};
