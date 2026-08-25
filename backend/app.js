// app.js
// Express app เพียวๆ ไม่รวม logic การเชื่อมต่อ DB หรือ app.listen
// แยกไว้แบบนี้เพื่อให้ไฟล์ test (Jest) import ไปใช้ได้โดยไม่ต้อง start server จริง

const express = require('express');
const cors = require('cors');
const Neighbor = require('./models/Neighbor');
const Story = require('./models/Story');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const app = express();

app.use(cors());
app.use(express.json());

// GET /health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// ===================== Auth: /api/auth =====================
app.use('/api/auth', authRoutes);

// ===================== Profile: /api/profile =====================
app.use('/api/profile', profileRoutes);

// ===================== CRUD: /api/neighbors =====================

// GET /api/neighbors - รายชื่อเพื่อนบ้านทั้งหมด พร้อมเรื่องราวของแต่ละคน
app.get('/api/neighbors', async (req, res) => {
  try {
    const neighbors = await Neighbor.findAll({
      include: [{ model: Story, as: 'stories' }],
      order: [['id', 'ASC']],
    });
    res.json(neighbors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/neighbors/:id - เพื่อนบ้านคนเดียว พร้อมเรื่องราวทั้งหมด
app.get('/api/neighbors/:id', async (req, res) => {
  try {
    const neighbor = await Neighbor.findByPk(req.params.id, {
      include: [{ model: Story, as: 'stories' }],
    });
    if (!neighbor) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลเพื่อนบ้านคนนี้' });
    }
    res.json(neighbor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/neighbors - เพิ่มเพื่อนบ้านใหม่
app.post('/api/neighbors', async (req, res) => {
  try {
    const { full_name, house_number, phone, family_members, occupation, relationship_status } = req.body;
    if (!full_name) {
      return res.status(400).json({ error: 'full_name จำเป็นต้องระบุ' });
    }
    const newNeighbor = await Neighbor.create({
      full_name,
      house_number,
      phone,
      family_members,
      occupation,
      relationship_status,
    });
    res.status(201).json(newNeighbor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/neighbors/:id - แก้ไขข้อมูลเพื่อนบ้าน
app.put('/api/neighbors/:id', async (req, res) => {
  try {
    const neighbor = await Neighbor.findByPk(req.params.id);
    if (!neighbor) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลเพื่อนบ้านคนนี้' });
    }
    await neighbor.update(req.body);
    res.json(neighbor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/neighbors/:id - ลบเพื่อนบ้าน (เรื่องราวที่เกี่ยวข้องถูกลบตามด้วย CASCADE)
app.delete('/api/neighbors/:id', async (req, res) => {
  try {
    const neighbor = await Neighbor.findByPk(req.params.id);
    if (!neighbor) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลเพื่อนบ้านคนนี้' });
    }
    await neighbor.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== CRUD: เรื่องราว (Story) ของแต่ละเพื่อนบ้าน =====================

// GET /api/neighbors/:id/stories - ดูเรื่องราวทั้งหมดของเพื่อนบ้านคนนี้
app.get('/api/neighbors/:id/stories', async (req, res) => {
  try {
    const neighbor = await Neighbor.findByPk(req.params.id);
    if (!neighbor) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลเพื่อนบ้านคนนี้' });
    }
    const stories = await Story.findAll({
      where: { neighbor_id: req.params.id },
      order: [['event_date', 'DESC']],
    });
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/neighbors/:id/stories - เพิ่มเรื่องราวใหม่ให้เพื่อนบ้านคนนี้
app.post('/api/neighbors/:id/stories', async (req, res) => {
  try {
    const neighbor = await Neighbor.findByPk(req.params.id);
    if (!neighbor) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลเพื่อนบ้านคนนี้' });
    }
    const { title, content, event_date } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'title จำเป็นต้องระบุ' });
    }
    const newStory = await Story.create({
      title,
      content,
      event_date,
      neighbor_id: req.params.id,
    });
    res.status(201).json(newStory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/stories/:id - แก้ไขเรื่องราว
app.put('/api/stories/:id', async (req, res) => {
  try {
    const story = await Story.findByPk(req.params.id);
    if (!story) {
      return res.status(404).json({ error: 'ไม่พบเรื่องราวนี้' });
    }
    await story.update(req.body);
    res.json(story);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/stories/:id - ลบเรื่องราว
app.delete('/api/stories/:id', async (req, res) => {
  try {
    const story = await Story.findByPk(req.params.id);
    if (!story) {
      return res.status(404).json({ error: 'ไม่พบเรื่องราวนี้' });
    }
    await story.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;