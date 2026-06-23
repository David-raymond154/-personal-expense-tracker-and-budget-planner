const db = require('../models/db');
const { parsePositiveAmount, isValidDate, httpError } = require('../models/validators');

/**
 * Build a WHERE clause fragment filtering income by optional month/year.
 * Returns { clause, params }.
 */
function buildPeriodFilter(userId, query) {
  const conditions = ['user_id = ?'];
  const params = [userId];

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

  return { clause: conditions.join(' AND '), params };
}

/**
 * POST /api/income
 */
function createIncome(req, res, next) {
  try {
    const { amount, source, description, date } = req.body || {};
    const validAmount = parsePositiveAmount(amount, 'amount');

    if (!source || typeof source !== 'string' || !source.trim()) {
      throw httpError('source is required');
    }
    if (!isValidDate(date)) {
      throw httpError('date is required and must be a valid YYYY-MM-DD date');
    }

    const info = db
      .prepare(
        'INSERT INTO income (user_id, amount, source, description, date) VALUES (?, ?, ?, ?, ?)'
      )
      .run(req.user.id, validAmount, source.trim(), description ? String(description) : null, date);

    const record = db.prepare('SELECT * FROM income WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ income: record });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/income  — list (filterable by month/year)
 */
function listIncome(req, res, next) {
  try {
    const { clause, params } = buildPeriodFilter(req.user.id, req.query);
    const rows = db
      .prepare(`SELECT * FROM income WHERE ${clause} ORDER BY date DESC, id DESC`)
      .all(...params);
    res.json({ income: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/income/summary — total income for a period (month/year optional).
 */
function incomeSummary(req, res, next) {
  try {
    const { clause, params } = buildPeriodFilter(req.user.id, req.query);
    const row = db
      .prepare(`SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM income WHERE ${clause}`)
      .get(...params);
    res.json({ total: row.total, count: row.count });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/income/:id
 */
function updateIncome(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = db
      .prepare('SELECT * FROM income WHERE id = ? AND user_id = ?')
      .get(id, req.user.id);
    if (!existing) throw httpError('Income record not found', 404);

    const { amount, source, description, date } = req.body || {};

    const newAmount = amount !== undefined ? parsePositiveAmount(amount, 'amount') : existing.amount;

    let newSource = existing.source;
    if (source !== undefined) {
      if (typeof source !== 'string' || !source.trim()) throw httpError('source cannot be empty');
      newSource = source.trim();
    }

    let newDate = existing.date;
    if (date !== undefined) {
      if (!isValidDate(date)) throw httpError('date must be a valid YYYY-MM-DD date');
      newDate = date;
    }

    const newDescription =
      description !== undefined ? (description ? String(description) : null) : existing.description;

    db.prepare(
      'UPDATE income SET amount = ?, source = ?, description = ?, date = ? WHERE id = ?'
    ).run(newAmount, newSource, newDescription, newDate, id);

    const updated = db.prepare('SELECT * FROM income WHERE id = ?').get(id);
    res.json({ income: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/income/:id
 */
function deleteIncome(req, res, next) {
  try {
    const id = Number(req.params.id);
    const info = db.prepare('DELETE FROM income WHERE id = ? AND user_id = ?').run(id, req.user.id);
    if (info.changes === 0) throw httpError('Income record not found', 404);
    res.json({ message: 'Income record deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createIncome,
  listIncome,
  incomeSummary,
  updateIncome,
  deleteIncome,
};
