const { app, request, registerUser, authHeader } = require('./helpers');

describe('Budget module', () => {
  let token;

  beforeEach(async () => {
    ({ token } = await registerUser());
  });

  test('creates a budget', async () => {
    const res = await request(app)
      .post('/api/budgets')
      .set(authHeader(token))
      .send({ category: 'Food', month: 6, year: 2026, limit_amount: 200 });
    expect(res.status).toBe(201);
    expect(res.body.budget).toMatchObject({ category: 'Food', limit_amount: 200 });
  });

  test('rejects duplicate budget for same category/month/year', async () => {
    await request(app)
      .post('/api/budgets')
      .set(authHeader(token))
      .send({ category: 'Food', month: 6, year: 2026, limit_amount: 200 });
    const dup = await request(app)
      .post('/api/budgets')
      .set(authHeader(token))
      .send({ category: 'Food', month: 6, year: 2026, limit_amount: 300 });
    expect(dup.status).toBe(409);
  });

  test('rejects invalid month or non-positive limit', async () => {
    const badMonth = await request(app)
      .post('/api/budgets')
      .set(authHeader(token))
      .send({ category: 'Food', month: 13, year: 2026, limit_amount: 200 });
    expect(badMonth.status).toBe(400);

    const badLimit = await request(app)
      .post('/api/budgets')
      .set(authHeader(token))
      .send({ category: 'Food', month: 6, year: 2026, limit_amount: 0 });
    expect(badLimit.status).toBe(400);
  });

  test('lists budgets for a given month', async () => {
    await request(app)
      .post('/api/budgets')
      .set(authHeader(token))
      .send({ category: 'Food', month: 6, year: 2026, limit_amount: 200 });
    await request(app)
      .post('/api/budgets')
      .set(authHeader(token))
      .send({ category: 'Transport', month: 6, year: 2026, limit_amount: 100 });

    const res = await request(app)
      .get('/api/budgets?month=6&year=2026')
      .set(authHeader(token));
    expect(res.body.budgets).toHaveLength(2);
  });

  test('budget status reflects spending and exceeded flag', async () => {
    await request(app)
      .post('/api/budgets')
      .set(authHeader(token))
      .send({ category: 'Food', month: 6, year: 2026, limit_amount: 100 });

    await request(app)
      .post('/api/expenses')
      .set(authHeader(token))
      .send({ amount: 60, category: 'Food', date: '2026-06-05' });
    await request(app)
      .post('/api/expenses')
      .set(authHeader(token))
      .send({ amount: 70, category: 'Food', date: '2026-06-06' });

    const res = await request(app)
      .get('/api/budgets/status?month=6&year=2026')
      .set(authHeader(token));
    const food = res.body.status.find((s) => s.category === 'Food');
    expect(food.amount_spent).toBe(130);
    expect(food.amount_remaining).toBe(-30);
    expect(food.is_exceeded).toBe(true);
  });

  test('updates and deletes a budget', async () => {
    const created = await request(app)
      .post('/api/budgets')
      .set(authHeader(token))
      .send({ category: 'Food', month: 6, year: 2026, limit_amount: 100 });
    const id = created.body.budget.id;

    const upd = await request(app)
      .put(`/api/budgets/${id}`)
      .set(authHeader(token))
      .send({ limit_amount: 250 });
    expect(upd.status).toBe(200);
    expect(upd.body.budget.limit_amount).toBe(250);

    const del = await request(app).delete(`/api/budgets/${id}`).set(authHeader(token));
    expect(del.status).toBe(200);
  });

  test('a user cannot modify another user\'s budget', async () => {
    const created = await request(app)
      .post('/api/budgets')
      .set(authHeader(token))
      .send({ category: 'Food', month: 6, year: 2026, limit_amount: 100 });
    const id = created.body.budget.id;

    const { token: otherToken } = await registerUser();
    const del = await request(app).delete(`/api/budgets/${id}`).set(authHeader(otherToken));
    expect(del.status).toBe(404);
  });
});
