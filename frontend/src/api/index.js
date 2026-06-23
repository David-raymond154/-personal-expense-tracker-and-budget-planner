import client from './client';

// ---- Auth ----
export const authApi = {
  register: (data) => client.post('/auth/register', data).then((r) => r.data),
  login: (data) => client.post('/auth/login', data).then((r) => r.data),
  logout: () => client.post('/auth/logout').then((r) => r.data),
  resetPassword: (email) => client.post('/auth/reset-password', { email }).then((r) => r.data),
  getProfile: () => client.get('/auth/profile').then((r) => r.data),
  updateProfile: (data) => client.put('/auth/profile', data).then((r) => r.data),
};

// ---- Income ----
export const incomeApi = {
  list: (params) => client.get('/income', { params }).then((r) => r.data.income),
  summary: (params) => client.get('/income/summary', { params }).then((r) => r.data),
  create: (data) => client.post('/income', data).then((r) => r.data.income),
  update: (id, data) => client.put(`/income/${id}`, data).then((r) => r.data.income),
  remove: (id) => client.delete(`/income/${id}`).then((r) => r.data),
};

// ---- Expenses ----
export const expenseApi = {
  list: (params) => client.get('/expenses', { params }).then((r) => r.data.expenses),
  categories: () => client.get('/expenses/categories').then((r) => r.data.categories),
  create: (data) => client.post('/expenses', data).then((r) => r.data),
  update: (id, data) => client.put(`/expenses/${id}`, data).then((r) => r.data),
  remove: (id) => client.delete(`/expenses/${id}`).then((r) => r.data),
};

// ---- Budgets ----
export const budgetApi = {
  list: (params) => client.get('/budgets', { params }).then((r) => r.data.budgets),
  status: (params) => client.get('/budgets/status', { params }).then((r) => r.data.status),
  create: (data) => client.post('/budgets', data).then((r) => r.data.budget),
  update: (id, data) => client.put(`/budgets/${id}`, data).then((r) => r.data.budget),
  remove: (id) => client.delete(`/budgets/${id}`).then((r) => r.data),
};

// ---- Reports ----
export const reportApi = {
  monthly: (params) => client.get('/reports/monthly', { params }).then((r) => r.data),
  summary: () => client.get('/reports/summary').then((r) => r.data),
  byCategory: (params) => client.get('/reports/by-category', { params }).then((r) => r.data.by_category),
  savingsProgress: () =>
    client.get('/reports/savings-progress').then((r) => r.data.savings_progress),
};
