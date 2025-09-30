// models/Budget.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const Budget = sequelize.define("Budget", {
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  month: {
    type: DataTypes.STRING, // format: "2025-09"
    allowNull: false,
  }
});

// Each budget belongs to a user
User.hasMany(Budget, { foreignKey: "userId" });
Budget.belongsTo(User, { foreignKey: "userId" });

module.exports = Budget;
