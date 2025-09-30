const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const Transaction = require("../models/Transaction");
const { Op } = require("sequelize");

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const income = await Transaction.sum("amount", {
      where: { userId: req.user.id, type: "income", date: { [Op.gte]: monthStart } }
    });

    const expenses = await Transaction.sum("amount", {
      where: { userId: req.user.id, type: "expense", date: { [Op.gte]: monthStart } }
    });

    const netSavings = (income || 0) - (expenses || 0);

    const byCategory = await Transaction.findAll({
      attributes: ["category", [require("sequelize").fn("SUM", require("sequelize").col("amount")), "total"]],
      where: { userId: req.user.id, type: "expense", date: { [Op.gte]: monthStart } },
      group: ["category"]
    });

    res.json({
      month: `${now.getFullYear()}-${now.getMonth() + 1}`,
      income: income || 0,
      expenses: expenses || 0,
      netSavings,
      spendingByCategory: byCategory
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
