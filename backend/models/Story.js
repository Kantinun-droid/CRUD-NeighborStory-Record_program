// models/Story.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Neighbor = require('./Neighbor');

const Story = sequelize.define('Story', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    // หัวข้อเรื่อง
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    // เนื้อหาเรื่องราว
    type: DataTypes.TEXT,
    allowNull: true,
  },
  event_date: {
    // วันที่เกิดเหตุการณ์
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
}, {
  tableName: 'stories',
  timestamps: true,
});

// ความสัมพันธ์: 1 เพื่อนบ้าน มีได้หลายเรื่องราว
Neighbor.hasMany(Story, { foreignKey: 'neighbor_id', as: 'stories', onDelete: 'CASCADE' });
Story.belongsTo(Neighbor, { foreignKey: 'neighbor_id', as: 'neighbor' });

module.exports = Story;