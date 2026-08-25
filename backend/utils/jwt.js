// utils/jwt.js
// รวมฟังก์ชันสร้างและตรวจสอบ JWT (access token / refresh token)
// แยกไว้เป็น utility กลาง เพื่อให้ routes/auth.js และ middleware/auth.js เรียกใช้ร่วมกันได้

const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me';

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// สร้าง access token อายุสั้น ใช้แนบไปกับ request เพื่อเข้าถึง protected routes
function signAccessToken(userId) {
  return jwt.sign({ sub: userId, type: 'access' }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

// สร้าง refresh token อายุยาว ใช้ขอ access token ใหม่เมื่อหมดอายุ
function signRefreshToken(userId) {
  return jwt.sign({ sub: userId, type: 'refresh' }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

// ตรวจสอบ access token คืนค่า payload ถ้าถูกต้อง / throw ถ้าไม่ถูกต้องหรือหมดอายุ
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

// ตรวจสอบ refresh token คืนค่า payload ถ้าถูกต้อง / throw ถ้าไม่ถูกต้องหรือหมดอายุ
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
