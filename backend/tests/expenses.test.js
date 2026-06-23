const { app, request, registerUser, authHeader } = require('./helpers');

describe('Expense module', () => {
  let token;

  beforeEach(async () => {
    ({ token } = await registerUser());
  });

  test('lists valid categories', async () => {
    const res = await request(app).get('/api/expenses/categories').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.categories).toContain('Food');
    expect(res.body.categories).toContain('Other');
    expect(res.body.categories).toHaveLength(9);
  });

  test('creates an expense with a valid category', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set(authHeader(token))
      .send({ amount: 25.5, category: 'Food', description: 'Lunch', date: '2026-06-10' });
    expect(res.status).toBe(201);
    expect(res.body.expense).toMatchObject({ amount: 25.5, category: 'Food' });
    expect(res.body.warning).toBeNull();
  });

  test('rejects an invalid category', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set(authHeader(token))
      .send({ amount: 10, category: 'Gambling', date: '2026-06-10' });
    expect(res.status).toBe(400);
  });

  test('filters expenses by category and date range', async () => {
    await request(app)
      .post('/api/expenses')
      .set(authHeader(token))
      .send({ amount: 10, category: 'Food', date: '2026-06-01' });
    await request(app)
      .post('/api/expenses')
      .set(authHeader(token))
      .send({ amount: 20, category: 'Transport', date: '2026-06-15' });
    await request(app)
      .post('/api/expenses')
      .set(authHeader(token))
      .send({ amount: 30, category: 'Food', date: '2026-07-01' });

    const food = await request(app)
      .get('/api/expenses?category=Food')
      .set(authHeader(token));
    expect(food.body.expenses).toHaveLength(2);

    const range = await request(app)
      .get('/api/expenses?startDate=2026-06-01&endDate=2026-06-30')
      .set(authHeader(token));
    expect(range.body.expenses).toHaveLength(2);
  });

  test('updates and deletes an expense', async () => {
    const created = await request(app)
      .post('/api/expenses')
      .set(authHeader(token))
      .send({ amount: 10, category: 'Food', date: '2026-06-01' });
    const id = created.body.expense.id;

    const upd = await request(app)
      .put(`/api/expenses/${id}`)
      .set(authHeader(token))
      .send({ amount: 12, category: 'Transport' });
    expect(upd.status).toBe(200);
    expect(upd.body.expense).toMatchObject({ amount: 12, category: 'Transport' });

    const del = await request(app).delete(`/api/expenses/${id}`).set(authHeader(token));
    expect(del.status).toBe(200);
  });

  test('returns an overspending warning when a budget is exceeded', async () => {
    await request(app)
      .post('/api/budgets')
      .set(authHeader(token))
      .send({ category: 'Food', month: 6, year: 2026, limit_amount: 50 });

    const first = await request(app)
      .post('/api/expenses')
      .set(authHeader(token))
      .send({ amount: 30, category: 'Food', date: '2026-06-05' });
    expect(first.body.warning).toBeNull();

    const second = await request(app)
      .post('/api/expenses')
      .set(authHeader(token))
      .send({ amount: 40, category: 'Food', date: '2026-06-06' });
    expect(second.body.warning).not.toBeNull();
    expect(second.body.warning.category).toBe('Food');
    expect(second.body.warning.amount_spent).toBe(70);
  });

  test('a user cannot see another user\'s expenses', async () => {
    await request(app)
      .post('/api/expenses')
      .set(authHeader(token))
      .send({ amount: 10, category: 'Food', date: '2026-06-01' });

    const { token: otherToken } = await registerUser();
    const list = await request(app).get('/api/expenses').set(authHeader(otherToken));
    expect(list.body.expenses).toHaveLength(0);
  });
});
