const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Neighbor = sequelize.define('Neighbor', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  full_name: { type: DataTypes.STRING, allowNull: false },
  house_number: { type: DataTypes.STRING, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: true },
  family_members: { type: DataTypes.INTEGER, allowNull: true },
  occupation: { type: DataTypes.STRING, allowNull: true },
  relationship_status: {
    type: DataTypes.ENUM('สนิท', 'รู้จัก', 'ไม่ค่อยรู้จัก'),
    allowNull: false,
    defaultValue: 'รู้จัก',
  },
}, {
  tableName: 'neighbors',
  timestamps: true,
});

module.exports = Neighbor;