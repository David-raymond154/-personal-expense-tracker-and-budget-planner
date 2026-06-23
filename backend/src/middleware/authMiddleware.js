const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

/**
 * Express middleware that validates the JWT supplied in the
 * `Authorization: Bearer <token>` header. On success it attaches
 * `req.user = { id, email }` and calls next(). On failure it responds 401.
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const parts = header.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Authorization header missing or malformed' });
  }

  const token = parts[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, email: payload.email };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
module.exports.JWT_SECRET = JWT_SECRET;
