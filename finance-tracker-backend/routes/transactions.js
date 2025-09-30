const express = require("express");
const { Op, fn, col } = require("sequelize");
const Transaction = require("../models/Transaction");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Protect all routes
router.use(authenticateToken);

/**
 * POST /transactions
 * Create a new transaction for the logged-in user
 */
router.post("/", async (req, res) => {
  try {
    const { amount, type, category, date, note } = req.body;

    if (!amount || !type || !category) {
      return res.status(400).json({ error: "amount, type, and category are required" });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ error: "type must be 'income' or 'expense'" });
    }

    const tx = await Transaction.create({
      amount,
      type,
      category,
      date, // optional — defaults to today
      note,
      userId: req.user.id, // ✅ ensure logged-in user
    });

    res.json({ message: "Transaction added ✅", transaction: tx });
  } catch (err) {
    console.error("❌ Error in POST /transactions:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /transactions
 * Get all transactions for the logged-in user with optional filters
 */
router.get("/", async (req, res) => {
  try {
    const { type, from, to, category } = req.query;

    const where = { userId: req.user.id }; // ✅ filter by user

    if (type && ["income", "expense"].includes(type)) where.type = type;
    if (category) where.category = category;
    if (from || to) {
      where.date = {};
      if (from) where.date[Op.gte] = from;
      if (to) where.date[Op.lte] = to;
    }

    const items = await Transaction.findAll({
      where,
      order: [["date", "DESC"], ["createdAt", "DESC"]],
    });

    res.json(items);
  } catch (err) {
    console.error("❌ Error in GET /transactions:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /transactions/:id
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const tx = await Transaction.findOne({ where: { id, userId: req.user.id } });
    if (!tx) return res.status(404).json({ error: "Transaction not found" });

    const { amount, type, category, date, note } = req.body;

    if (type && !["income", "expense"].includes(type)) {
      return res.status(400).json({ error: "type must be 'income' or 'expense'" });
    }

    await tx.update({ amount, type, category, date, note });
    res.json({ message: "Transaction updated ✅", transaction: tx });
  } catch (err) {
    console.error("❌ Error in PUT /transactions/:id:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /transactions/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Transaction.destroy({ where: { id, userId: req.user.id } });
    if (!deleted) return res.status(404).json({ error: "Transaction not found" });
    res.json({ message: "Transaction deleted ✅" });
  } catch (err) {
    console.error("❌ Error in DELETE /transactions/:id:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /transactions/summary
 */
router.get("/summary", async (req, res) => {
  try {
    const incomeRow = await Transaction.findOne({
      attributes: [[fn("COALESCE", fn("SUM", col("amount")), 0), "total"]],
      where: { userId: req.user.id, type: "income" },
      raw: true,
    });

    const expenseRow = await Transaction.findOne({
      attributes: [[fn("COALESCE", fn("SUM", col("amount")), 0), "total"]],
      where: { userId: req.user.id, type: "expense" },
      raw: true,
    });

    const income = parseFloat(incomeRow.total);
    const expenses = parseFloat(expenseRow.total);
    const netSavings = income - expenses;

    res.json({ income, expenses, netSavings });
  } catch (err) {
    console.error("❌ Error in GET /transactions/summary:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /transactions/by-category
 */
router.get("/by-category", async (req, res) => {
  try {
    const { type } = req.query;
    const where = { userId: req.user.id };
    if (type && ["income", "expense"].includes(type)) where.type = type;

    const rows = await Transaction.findAll({
      attributes: ["category", [fn("SUM", col("amount")), "total"]],
      where,
      group: ["category"],
      order: [[fn("SUM", col("amount")), "DESC"]],
      raw: true,
    });

    const result = rows.map((r) => ({ category: r.category, total: parseFloat(r.total) }));
    res.json(result);
  } catch (err) {
    console.error("❌ Error in GET /transactions/by-category:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /transactions/generate-recurring
 */
router.post("/generate-recurring", async (req, res) => {
  try {
    const recurring = await Transaction.findAll({
      where: { userId: req.user.id, isRecurring: true },
    });

    const today = new Date();
    const newTransactions = [];

    for (let tx of recurring) {
      let shouldGenerate = false;

      if (tx.interval === "monthly" && today.getDate() === new Date(tx.date).getDate()) {
        shouldGenerate = true;
      } else if (tx.interval === "weekly" && today.getDay() === new Date(tx.date).getDay()) {
        shouldGenerate = true;
      }

      if (shouldGenerate) {
        const newTx = await Transaction.create({
          userId: req.user.id,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          date: today,
          isRecurring: false,
        });
        newTransactions.push(newTx);
      }
    }

    res.json({ message: "Recurring transactions generated ✅", newTransactions });
  } catch (err) {
    console.error("❌ Error in POST /transactions/generate-recurring:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
