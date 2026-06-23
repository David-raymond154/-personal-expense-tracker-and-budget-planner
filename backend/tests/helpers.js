const request = require('supertest');
const app = require('../src/app');

/**
 * Register a new user and return { token, user }.
 */
async function registerUser(overrides = {}) {
  const payload = {
    name: 'Test Student',
    email: `user_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`,
    password: 'password123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  return { res, ...res.body, password: payload.password, email: payload.email };
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = { app, request, registerUser, authHeader };
