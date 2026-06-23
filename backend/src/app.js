const express = require('express');
const cors = require('cors');

// Ensure migrations run as soon as the app module is loaded.
require('./models/db');

const authRoutes = require('./routes/authRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Feature routes
app.use('/api/auth', authRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/reports', reportRoutes);

// 404 + error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
