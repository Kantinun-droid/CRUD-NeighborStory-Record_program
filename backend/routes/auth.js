// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const User = require('../models/User');
const Profile = require('../models/Profile');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');

const SALT_ROUNDS = 10;

// POST /api/auth/register - สมัครสมาชิก
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'ต้องระบุ email และ password' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'password ต้องมีอย่างน้อย 8 ตัวอักษร' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'อีเมลนี้ถูกใช้สมัครแล้ว' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = await User.create({ email, password_hash });

    await Profile.create({ user_id: newUser.id });

    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/login - ตรวจสอบ email/password แล้วออก JWT
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'ต้องระบุ email และ password' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    user.refresh_token = refreshToken;
    await user.save();

    res.json({ accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/refresh - ขอ access token ใหม่จาก refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'ต้องระบุ refreshToken' });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ error: 'refresh token ไม่ถูกต้องหรือหมดอายุแล้ว' });
    }

    const user = await User.findByPk(payload.sub);
    if (!user || user.refresh_token !== refreshToken) {
      return res.status(401).json({ error: 'refresh token ไม่ถูกต้อง' });
    }

    const newAccessToken = signAccessToken(user.id);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout - ยกเลิก refresh token
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'ต้องระบุ refreshToken' });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(204).send();
    }

    const user = await User.findByPk(payload.sub);
    if (user && user.refresh_token === refreshToken) {
      user.refresh_token = null;
      await user.save();
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;