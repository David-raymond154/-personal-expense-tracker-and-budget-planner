const { app, request, registerUser, authHeader } = require('./helpers');

describe('Auth module', () => {
  test('registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret123',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toMatchObject({ name: 'Alice', email: 'alice@example.com' });
    expect(res.body.user.password_hash).toBeUndefined();
  });

  test('rejects duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'secret123',
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bob Again',
      email: 'bob@example.com',
      password: 'secret123',
    });
    expect(res.status).toBe(409);
  });

  test('rejects registration with invalid email or short password', async () => {
    const badEmail = await request(app)
      .post('/api/auth/register')
      .send({ name: 'X', email: 'not-an-email', password: 'secret123' });
    expect(badEmail.status).toBe(400);

    const shortPw = await request(app)
      .post('/api/auth/register')
      .send({ name: 'X', email: 'x@example.com', password: '123' });
    expect(shortPw.status).toBe(400);
  });

  test('logs in with valid credentials and rejects invalid ones', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Carol',
      email: 'carol@example.com',
      password: 'secret123',
    });

    const ok = await request(app)
      .post('/api/auth/login')
      .send({ email: 'carol@example.com', password: 'secret123' });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeDefined();

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: 'carol@example.com', password: 'wrong' });
    expect(bad.status).toBe(401);
  });

  test('protected route requires a valid token', async () => {
    const noToken = await request(app).get('/api/auth/profile');
    expect(noToken.status).toBe(401);

    const badToken = await request(app)
      .get('/api/auth/profile')
      .set(authHeader('garbage.token.value'));
    expect(badToken.status).toBe(401);
  });

  test('updates profile name and password', async () => {
    const { token } = await registerUser();

    const res = await request(app)
      .put('/api/auth/profile')
      .set(authHeader(token))
      .send({ name: 'Updated Name', password: 'newpassword123' });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Updated Name');
  });

  test('reset-password responds the same whether or not the email exists', async () => {
    const { email } = await registerUser();

    const existing = await request(app).post('/api/auth/reset-password').send({ email });
    const missing = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'nobody@example.com' });

    expect(existing.status).toBe(200);
    expect(missing.status).toBe(200);
    expect(existing.body.message).toEqual(missing.body.message);
  });
});
