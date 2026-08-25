// routes/profile.js
// API สำหรับดู/แก้ไขโปรไฟล์ของผู้ใช้ที่ login อยู่ (ต้องแนบ access token)
const express = require('express');
const router = express.Router();

const Profile = require('../models/Profile');
const requireAuth = require('../middleware/auth');

// เฉพาะฟิลด์เหล่านี้เท่านั้นที่แก้ไขผ่าน API นี้ได้ (กันไม่ให้แก้ user_id หรือฟิลด์ auth)
const EDITABLE_FIELDS = ['display_name', 'avatar_url', 'bio', 'phone'];

// GET /api/profile - ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่ login อยู่
router.get('/', requireAuth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ where: { user_id: req.userId } });
    if (!profile) {
      return res.status(404).json({ error: 'ไม่พบโปรไฟล์ของผู้ใช้นี้' });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/profile - แก้ไขข้อมูลโปรไฟล์บางส่วน (ไม่บังคับกรอกครบทุกช่อง)
router.patch('/', requireAuth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ where: { user_id: req.userId } });
    if (!profile) {
      return res.status(404).json({ error: 'ไม่พบโปรไฟล์ของผู้ใช้นี้' });
    }

    const updates = {};
    for (const field of EDITABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    await profile.update(updates);
    res.json(profile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
