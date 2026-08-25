// tests/auth.test.js
const request = require('supertest');
const app = require('../app');
const sequelize = require('../db');
const User = require('../models/User');
const Profile = require('../models/Profile');

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await Profile.destroy({ where: {}, truncate: true, cascade: true });
  await User.destroy({ where: {}, truncate: true, cascade: true });
});

describe('POST /api/auth/register', () => {
  it('ควรสมัครสมาชิกได้ และสร้างโปรไฟล์เปล่าให้อัตโนมัติ', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'somchai@example.com', password: 'password123' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('email', 'somchai@example.com');
    expect(res.body).not.toHaveProperty('password_hash');

    const profile = await Profile.findOne({ where: { user_id: res.body.id } });
    expect(profile).not.toBeNull();
  });

  it('ควรตอบ 409 ถ้าอีเมลถูกใช้สมัครแล้ว', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'password123' });

    expect(res.statusCode).toBe(409);
  });

  it('ควรตอบ 400 ถ้า password สั้นเกินไป', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'short@example.com', password: '123' });

    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/auth/login และ protected routes', () => {
  const credentials = { email: 'login@example.com', password: 'password123' };

  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(credentials);
  });

  it('ควร login สำเร็จและได้ accessToken กับ refreshToken', async () => {
    const res = await request(app).post('/api/auth/login').send(credentials);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('ควรตอบ 401 ถ้ารหัสผ่านผิด', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
  });

  it('ควรเข้าถึง /api/profile ได้เมื่อแนบ accessToken ที่ถูกต้อง', async () => {
    const login = await request(app).post('/api/auth/login').send(credentials);
    const { accessToken } = login.body;

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('user_id');
  });

  it('ควรตอบ 401 ถ้าเรียก /api/profile โดยไม่แนบ token', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.statusCode).toBe(401);
  });

  it('ควรแก้ไขโปรไฟล์บางส่วนผ่าน PATCH /api/profile ได้', async () => {
    const login = await request(app).post('/api/auth/login').send(credentials);
    const { accessToken } = login.body;

    const res = await request(app)
      .patch('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ display_name: 'สมชาย', bio: 'สวัสดีครับ' });

    expect(res.statusCode).toBe(200);
    expect(res.body.display_name).toBe('สมชาย');
    expect(res.body.bio).toBe('สวัสดีครับ');
  });

  it('ควรขอ access token ใหม่ได้ด้วย POST /api/auth/refresh', async () => {
    const login = await request(app).post('/api/auth/login').send(credentials);
    const { refreshToken } = login.body;

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('ควร logout สำเร็จ และ refreshToken เดิมใช้ขอ access token ใหม่ไม่ได้อีก', async () => {
    const login = await request(app).post('/api/auth/login').send(credentials);
    const { refreshToken } = login.body;

    const logoutRes = await request(app).post('/api/auth/logout').send({ refreshToken });
    expect(logoutRes.statusCode).toBe(204);

    const refreshRes = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(refreshRes.statusCode).toBe(401);
  });
});
