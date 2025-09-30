const express = require("express");
const cors = require("cors");
require("dotenv").config();





const app = express();

//Middleware
app.use(cors({
  origin: "http://localhost:3000", // frontend origin
  credentials: true
}));
app.use(express.json());

// DB and models
const sequelize = require("./config/db");
const User = require("./models/User");
const Transaction = require("./models/Transaction"); // <- ensures model is registered

// (Optional but helpful) Sync DB at startup.
// Remove { force: true } if you used it before — it drops tables.
sequelize.sync()
  .then(() => console.log("✅ Database synced"))
  .catch(err => console.error("❌ Sync error:", err));

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Finance Tracker API running ✅" });
});

// Auth routes
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

// Transactions routes
const transactionRoutes = require("./routes/transactions");
app.use("/transactions", transactionRoutes);

// Budget routes
const budgetRoutes = require("./routes/budgets");
app.use("/budgets", budgetRoutes);

// Dashboard routes
const dashboardRoutes = require("./routes/dashboard");
app.use("/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
