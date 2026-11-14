const request = require('supertest');
const app = require('../src/app');
const { resetData, createUser, db } = require('./helpers');

let user;

beforeEach(async () => {
  await resetData();
  user = await createUser({ email: 'a@test.com', balance: 100000 });
});

afterAll(async () => {
  await db.pool.end();
});

describe('Đăng nhập', () => {
  test('đúng mật khẩu: nhận cookie httpOnly', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    expect(res.status).toBe(200);
    const cookie = res.headers['set-cookie'].join(';');
    expect(cookie).toMatch(/token=/);
    expect(cookie).toMatch(/HttpOnly/i);
  });

  test('sai mật khẩu: 401 và cùng thông báo với email không tồn tại', async () => {
    const wrongPass = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'sai-mat-khau' });
    const noUser = await request(app)
      .post('/api/auth/login')
      .send({ email: 'khong-co@test.com', password: 'sai-mat-khau' });
    expect(wrongPass.status).toBe(401);
    expect(noUser.status).toBe(401);
    expect(wrongPass.body.message).toBe(noUser.body.message);
  });
});

describe('Quyền truy cập', () => {
  test('chưa đăng nhập gọi API giao dịch: 401', async () => {
    const res = await request(app).post('/api/transactions/deposit').send({});
    expect(res.status).toBe(401);
  });

  test('chưa đăng nhập vào /dashboard: chuyển về /login', async () => {
    const res = await request(app).get('/dashboard');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  });

  test('đã đăng nhập nạp tiền qua API: thành công', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: user.email, password: user.password });
    const res = await agent
      .post('/api/transactions/deposit')
      .send({ amount: 20000, idempotencyKey: 'test-key-1234567890abcdef' });
    expect(res.status).toBe(201);
    expect(res.body.data.amount).toBe(20000);
  });

  test('gửi thêm trường role: bị bỏ qua (mass assignment)', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: user.email, password: user.password });
    await agent.put('/api/account/profile').send({ fullName: 'Tên mới', role: 'admin' });
    const { rows } = await db.query('SELECT role FROM users WHERE id = $1', [user.id]);
    expect(rows[0].role).toBe('user');
  });
});