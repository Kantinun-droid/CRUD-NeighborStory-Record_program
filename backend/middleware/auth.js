// middleware/auth.js
// Middleware ตรวจสอบ JWT access token ใน header Authorization: Bearer <token>
// ใช้ครอบ route ที่ต้อง login ก่อนเข้าถึง เช่น /api/profile

const { verifyAccessToken } = require('../utils/jwt');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'ต้องแนบ access token ในรูปแบบ Bearer token' });
  }

  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== 'access') {
      return res.status(401).json({ error: 'token ไม่ถูกต้อง' });
    }
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'access token ไม่ถูกต้องหรือหมดอายุแล้ว' });
  }
}

module.exports = requireAuth;
