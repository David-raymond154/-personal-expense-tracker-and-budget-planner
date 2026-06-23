/* eslint-disable no-unused-vars */

/**
 * 404 handler for unknown routes.
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

/**
 * Central error handler. Any error passed to next(err) ends up here.
 * Express identifies this as an error handler because it has 4 args.
 */
function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  // Only log unexpected (5xx) errors. Validation errors (4xx) are expected and
  // would otherwise flood the console/test output with stack traces.
  if (status >= 500 && process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  const message = err.expose ? err.message : (status === 500 ? 'Internal server error' : err.message);

  res.status(status).json({ error: message });
}

module.exports = { notFoundHandler, errorHandler };
