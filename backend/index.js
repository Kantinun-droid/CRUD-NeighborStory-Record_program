require('dotenv').config();
const app = require('./app');
const sequelize = require('./db');

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('เชื่อมต่อฐานข้อมูลสำเร็จ');
    await sequelize.sync();
    console.log('Sync ตาราง neighbors และ stories เรียบร้อย');
    app.listen(PORT, () => {
      console.log(`Server กำลังรันที่ port ${PORT}`);
    });
  } catch (err) {
    console.error('เชื่อมต่อฐานข้อมูลไม่สำเร็จ:', err.message);
    process.exit(1);
  }
}

start();