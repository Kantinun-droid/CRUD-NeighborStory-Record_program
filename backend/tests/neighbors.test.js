// tests/neighbors.test.js
const request = require('supertest');
const app = require('../app');
const sequelize = require('../db');
const Neighbor = require('../models/Neighbor');
const Story = require('../models/Story');

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await Story.destroy({ where: {}, truncate: true, cascade: true });
  await Neighbor.destroy({ where: {}, truncate: true, cascade: true });
});

describe('GET /health', () => {
  it('ควรตอบสถานะ ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});

describe('CRUD /api/neighbors', () => {
  it('POST ควรเพิ่มเพื่อนบ้านใหม่สำเร็จ', async () => {
    const res = await request(app).post('/api/neighbors').send({
      full_name: 'ป้าสมศรี ใจดี',
      house_number: '12/3',
      phone: '0812345678',
      family_members: 3,
      occupation: 'ค้าขาย',
      relationship_status: 'สนิท',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.full_name).toBe('ป้าสมศรี ใจดี');
  });

  it('POST ควรล้มเหลวถ้าไม่ส่ง full_name', async () => {
    const res = await request(app).post('/api/neighbors').send({ house_number: '99' });
    expect(res.statusCode).toBe(400);
  });

  it('GET ควรดึงรายชื่อเพื่อนบ้านทั้งหมดพร้อม stories', async () => {
    const neighbor = await Neighbor.create({ full_name: 'ลุงมานะ', relationship_status: 'รู้จัก' });
    await Story.create({ title: 'ช่วยดับไฟ', neighbor_id: neighbor.id });

    const res = await request(app).get('/api/neighbors');

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].stories.length).toBe(1);
  });

  it('DELETE ควรลบเพื่อนบ้านและเรื่องราวที่เกี่ยวข้อง (CASCADE)', async () => {
    const neighbor = await Neighbor.create({ full_name: 'น้าแดง', relationship_status: 'รู้จัก' });
    await Story.create({ title: 'เล่าเรื่องเก่า', neighbor_id: neighbor.id });

    const res = await request(app).delete(`/api/neighbors/${neighbor.id}`);
    expect(res.statusCode).toBe(204);

    const remainingStories = await Story.findAll({ where: { neighbor_id: neighbor.id } });
    expect(remainingStories.length).toBe(0);
  });
});

describe('CRUD /api/neighbors/:id/stories', () => {
  it('POST ควรเพิ่มเรื่องราวให้เพื่อนบ้านที่มีอยู่ได้', async () => {
    const neighbor = await Neighbor.create({ full_name: 'ป้าจิ๋ว', relationship_status: 'สนิท' });

    const res = await request(app)
      .post(`/api/neighbors/${neighbor.id}/stories`)
      .send({ title: 'แบ่งขนมให้ตอนเด็ก', content: 'รายละเอียดเรื่องราว', event_date: '2020-05-01' });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('แบ่งขนมให้ตอนเด็ก');
  });

  it('POST ควรตอบ 404 ถ้าเพื่อนบ้านไม่มีอยู่จริง', async () => {
    const res = await request(app)
      .post('/api/neighbors/99999/stories')
      .send({ title: 'ทดสอบ' });
    expect(res.statusCode).toBe(404);
  });

  it('PUT /api/stories/:id ควรแก้ไขเรื่องราวได้', async () => {
    const neighbor = await Neighbor.create({ full_name: 'ตาสมชาย', relationship_status: 'รู้จัก' });
    const story = await Story.create({ title: 'เรื่องเก่า', neighbor_id: neighbor.id });

    const res = await request(app)
      .put(`/api/stories/${story.id}`)
      .send({ title: 'เรื่องที่แก้ไขแล้ว' });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('เรื่องที่แก้ไขแล้ว');
  });

  it('DELETE /api/stories/:id ควรลบเรื่องราวได้', async () => {
    const neighbor = await Neighbor.create({ full_name: 'ยายทองดี', relationship_status: 'สนิท' });
    const story = await Story.create({ title: 'เรื่องที่จะลบ', neighbor_id: neighbor.id });

    const res = await request(app).delete(`/api/stories/${story.id}`);
    expect(res.statusCode).toBe(204);

    const check = await Story.findByPk(story.id);
    expect(check).toBeNull();
  });
});