const { app, request, registerUser, authHeader } = require('./helpers');

describe('Income module', () => {
  let token;

  beforeEach(async () => {
    ({ token } = await registerUser());
  });

  test('creates an income record', async () => {
    const res = await request(app)
      .post('/api/income')
      .set(authHeader(token))
      .send({ amount: 500, source: 'Part-time job', description: 'June pay', date: '2026-06-01' });
    expect(res.status).toBe(201);
    expect(res.body.income).toMatchObject({ amount: 500, source: 'Part-time job' });
  });

  test('rejects negative or missing amounts', async () => {
    const neg = await request(app)
      .post('/api/income')
      .set(authHeader(token))
      .send({ amount: -10, source: 'Job', date: '2026-06-01' });
    expect(neg.status).toBe(400);

    const noAmount = await request(app)
      .post('/api/income')
      .set(authHeader(token))
      .send({ source: 'Job', date: '2026-06-01' });
    expect(noAmount.status).toBe(400);
  });

  test('rejects invalid dates', async () => {
    const res = await request(app)
      .post('/api/income')
      .set(authHeader(token))
      .send({ amount: 100, source: 'Job', date: '2026-13-40' });
    expect(res.status).toBe(400);
  });

  test('lists income and filters by month/year', async () => {
    await request(app)
      .post('/api/income')
      .set(authHeader(token))
      .send({ amount: 100, source: 'A', date: '2026-05-10' });
    await request(app)
      .post('/api/income')
      .set(authHeader(token))
      .send({ amount: 200, source: 'B', date: '2026-06-10' });

    const all = await request(app).get('/api/income').set(authHeader(token));
    expect(all.body.income).toHaveLength(2);

    const june = await request(app)
      .get('/api/income?month=6&year=2026')
      .set(authHeader(token));
    expect(june.body.income).toHaveLength(1);
    expect(june.body.income[0].source).toBe('B');
  });

  test('returns a period summary total', async () => {
    await request(app)
      .post('/api/income')
      .set(authHeader(token))
      .send({ amount: 100, source: 'A', date: '2026-06-10' });
    await request(app)
      .post('/api/income')
      .set(authHeader(token))
      .send({ amount: 250, source: 'B', date: '2026-06-12' });

    const res = await request(app)
      .get('/api/income/summary?month=6&year=2026')
      .set(authHeader(token));
    expect(res.body.total).toBe(350);
    expect(res.body.count).toBe(2);
  });

  test('updates and deletes an income record', async () => {
    const created = await request(app)
      .post('/api/income')
      .set(authHeader(token))
      .send({ amount: 100, source: 'A', date: '2026-06-10' });
    const id = created.body.income.id;

    const upd = await request(app)
      .put(`/api/income/${id}`)
      .set(authHeader(token))
      .send({ amount: 175 });
    expect(upd.status).toBe(200);
    expect(upd.body.income.amount).toBe(175);

    const del = await request(app).delete(`/api/income/${id}`).set(authHeader(token));
    expect(del.status).toBe(200);

    const list = await request(app).get('/api/income').set(authHeader(token));
    expect(list.body.income).toHaveLength(0);
  });

  test('a user cannot access another user\'s income', async () => {
    const created = await request(app)
      .post('/api/income')
      .set(authHeader(token))
      .send({ amount: 100, source: 'A', date: '2026-06-10' });
    const id = created.body.income.id;

    const { token: otherToken } = await registerUser();
    const del = await request(app).delete(`/api/income/${id}`).set(authHeader(otherToken));
    expect(del.status).toBe(404);

    const list = await request(app).get('/api/income').set(authHeader(otherToken));
    expect(list.body.income).toHaveLength(0);
  });
});
