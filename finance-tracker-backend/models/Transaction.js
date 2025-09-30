const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User"); // we’ll use this to set the relation

const Transaction = sequelize.define("Transaction", {
  amount: {
    type: DataTypes.DECIMAL(10, 2), // store money precisely
    allowNull: false,
    validate: {
      isDecimal: true,
    },
  },
  type: {
    type: DataTypes.ENUM("income", "expense"),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY, // YYYY-MM-DD
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  note: {
    type: DataTypes.STRING,
    allowNull: true,
  },

});

// relations: each Transaction belongs to one User
User.hasMany(Transaction, { foreignKey: "userId", onDelete: "CASCADE" });
Transaction.belongsTo(User, { foreignKey: "userId" });

module.exports = Transaction;
