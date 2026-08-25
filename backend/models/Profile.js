const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

const Profile = sequelize.define('Profile', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  display_name: { type: DataTypes.STRING, allowNull: true },
  avatar_url: { type: DataTypes.STRING, allowNull: true },
  bio: { type: DataTypes.TEXT, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'profiles',
  timestamps: true,
});

User.hasOne(Profile, { foreignKey: 'user_id', as: 'profile', onDelete: 'CASCADE' });
Profile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = Profile;