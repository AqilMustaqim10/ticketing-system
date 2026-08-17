// backend/server.js
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

// Middleware
app.use(cors());
app.use(express.json());

// --- AUTH MIDDLEWARE ---
// Verifies JWT token sent in the "Authorization: Bearer <token>" header
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ error: "Access token required. Please log in." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ error: "Invalid or expired session. Please log in again." });
    }
    req.user = user;
    next();
  });
};

// --- ROUTE 1: GET METADATA (Business Units & Departments for UI dropdowns) ---
app.get("/api/metadata", (req, res) => {
  try {
    const businessUnits = db.prepare("SELECT * FROM business_units").all();
    const departments = db.prepare("SELECT * FROM departments").all();
    res.json({ businessUnits, departments });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch metadata" });
  }
});

// --- ROUTE 2: USER LOGIN ---
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    // Join with business_units and departments to get human-readable names
    const user = db
      .prepare(
        `
      SELECT u.*, bu.name as business_unit_name, d.name as department_name 
      FROM users u
      JOIN business_units bu ON u.business_unit_id = bu.id
      JOIN departments d ON u.department_id = d.id
      WHERE u.username = ?
    `,
      )
      .get(username.trim());

    if (!user) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    // Verify password hash
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    // Generate JWT Token (valid for 8 hours)
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        businessUnitId: user.business_unit_id,
        departmentId: user.department_id,
      },
      JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        username: user.username,
        role: user.role,
        businessUnitId: user.business_unit_id,
        businessUnitName: user.business_unit_name,
        departmentId: user.department_id,
        departmentName: user.department_name,
        mustChangePassword: Boolean(user.must_change_password),
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Internal server error during login" });
  }
});

// --- ROUTE 3: FORCE PASSWORD CHANGE ---
app.post("/api/auth/change-password", authenticateToken, async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.trim().length < 6) {
    return res
      .status(400)
      .json({ error: "New password must be at least 6 characters long" });
  }

  try {
    const newHash = await bcrypt.hash(newPassword.trim(), 10);

    db.prepare(
      `
      UPDATE users 
      SET password_hash = ?, must_change_password = 0 
      WHERE id = ?
    `,
    ).run(newHash, req.user.id);

    res.json({
      message:
        "Password updated successfully! You may now use your new password.",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update password" });
  }
});

// --- ROUTE 4: REGISTER NEW USER (Admin & Agents only) ---
app.post("/api/users/create", authenticateToken, async (req, res) => {
  // Enforce access control: Only ADMIN or AGENT roles can create users
  if (req.user.role !== "ADMIN" && req.user.role !== "AGENT") {
    return res.status(403).json({
      error: "Permission denied: Only IT Agents or Admins can register users.",
    });
  }

  const { fullName, username, businessUnitId, departmentId, role } = req.body;

  if (!fullName || !username || !businessUnitId || !departmentId) {
    return res.status(400).json({
      error: "Full name, username, Business Unit, and Department are required.",
    });
  }

  // Generate an auto-generated temporary password (e.g., Temp#x8f2)
  const tempPassword = "Temp#" + Math.random().toString(36).substring(2, 6);
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  try {
    const stmt = db.prepare(`
      INSERT INTO users (full_name, username, password_hash, business_unit_id, department_id, role, must_change_password)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    stmt.run(
      fullName.trim(),
      username.trim().toLowerCase(),
      passwordHash,
      businessUnitId,
      departmentId,
      role || "USER",
    );

    // Return receipt data to the agent so they can hand the password to the user
    res.json({
      message: "User registered successfully!",
      credentials: {
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        tempPassword, // Returned on-screen to IT Agent
        role: role || "USER",
      },
    });
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({
        error: `Username "${username}" already exists. Please choose another.`,
      });
    }
    res.status(500).json({ error: "Failed to register user." });
  }
});

// --- ROUTE 5: PASSWORD RESET BY AGENT/ADMIN ---
app.post("/api/users/reset-password", authenticateToken, async (req, res) => {
  if (req.user.role !== "ADMIN" && req.user.role !== "AGENT") {
    return res.status(403).json({ error: "Permission denied." });
  }

  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ error: "Target user ID is required." });
  }

  const newTempPassword = "Reset#" + Math.random().toString(36).substring(2, 6);
  const passwordHash = await bcrypt.hash(newTempPassword, 10);

  try {
    const result = db
      .prepare(
        `
      UPDATE users 
      SET password_hash = ?, must_change_password = 1 
      WHERE id = ?
    `,
      )
      .run(passwordHash, targetUserId);

    if (result.changes === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({
      message: "Password reset successfully.",
      newTempPassword, // Displayed on-screen to Agent
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset user password." });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(
    `🚀 IT Ticketing Backend API running on http://localhost:${PORT}`,
  );
});
