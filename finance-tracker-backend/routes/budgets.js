const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

const router = express.Router();

// Create budget
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { amount, category, month } = req.body;
    const budget = await Budget.create({
      amount,
      category,
      month,
      userId: req.user.id
    });
    res.json({ message: "Budget created ✅", budget });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all budgets for logged-in user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const budgets = await Budget.findAll({ where: { userId: req.user.id } });
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get budget progress
router.get("/:id/progress", authenticateToken, async (req, res) => {
  try {
    const budget = await Budget.findByPk(req.params.id);
    if (!budget || budget.userId !== req.user.id) {
      return res.status(404).json({ error: "Budget not found" });
    }

    // Calculate expenses
    const expenses = await Transaction.sum("amount", {
      where: {
        userId: req.user.id,
        type: "expense",
        category: budget.category,
        date: { [require("sequelize").Op.like]: `${budget.month}%` }
      }
    });

    const progress = {
      spent: expenses || 0,
      remaining: budget.amount - (expenses || 0)
    };

    res.json({ budget, progress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
