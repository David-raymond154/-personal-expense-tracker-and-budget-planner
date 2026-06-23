const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { isValidEmail, httpError } = require('../models/validators');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, created_at: user.created_at };
}

/**
 * POST /api/auth/register
 */
function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw httpError('Name is required');
    }
    if (!isValidEmail(email)) {
      throw httpError('A valid email is required');
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw httpError('Password is required and must be at least 6 characters');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      throw httpError('An account with that email already exists', 409);
    }

    const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
    const info = db
      .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run(name.trim(), normalizedEmail, passwordHash);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    const token = signToken(user);

    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!isValidEmail(email) || !password) {
      throw httpError('Email and password are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      throw httpError('Invalid email or password', 401);
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Token removal happens client-side; this endpoint just acknowledges.
 */
function logout(req, res) {
  res.json({ message: 'Logged out successfully. Please discard your token client-side.' });
}

/**
 * GET /api/auth/profile  (protected)
 */
function getProfile(req, res, next) {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) throw httpError('User not found', 404);
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/auth/profile  (protected) — update name and/or password.
 */
function updateProfile(req, res, next) {
  try {
    const { name, password } = req.body || {};
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) throw httpError('User not found', 404);

    if (name === undefined && password === undefined) {
      throw httpError('Provide a name or password to update');
    }

    let newName = user.name;
    let newHash = user.password_hash;

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        throw httpError('Name cannot be empty');
      }
      newName = name.trim();
    }

    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 6) {
        throw httpError('Password must be at least 6 characters');
      }
      newHash = bcrypt.hashSync(password, SALT_ROUNDS);
    }

    db.prepare('UPDATE users SET name = ?, password_hash = ? WHERE id = ?').run(
      newName,
      newHash,
      user.id
    );

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    res.json({ user: publicUser(updated) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/reset-password
 * No email server: we generate a temp password, store it, and log it to console.
 */
function resetPassword(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!isValidEmail(email)) {
      throw httpError('A valid email is required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);

    // Always respond the same way so we don't leak which emails exist.
    if (user) {
      const tempPassword = Math.random().toString(36).slice(-10);
      const hash = bcrypt.hashSync(tempPassword, SALT_ROUNDS);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
      // eslint-disable-next-line no-console
      console.log(`[reset-password] Temporary password for ${normalizedEmail}: ${tempPassword}`);
    }

    res.json({
      message:
        'If an account with that email exists, a temporary password has been generated and logged to the server console.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  resetPassword,
};
