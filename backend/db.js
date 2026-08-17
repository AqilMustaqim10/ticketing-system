// backend/db.js
const Database = require("better-sqlite3");
const path = require("path");

// Connect to (or create) tickets.db inside the backend folder
const db = new Database(path.join(__dirname, "tickets.db"));

// Enable Foreign Key support in SQLite
db.pragma("foreign_keys = ON");

// Initialize Database Schema
db.exec(`
  -- 1. Business Units Table (Hotel, CCEC, FNB)
  CREATE TABLE IF NOT EXISTS business_units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  -- 2. Departments Table (Linked to a Business Unit)
  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    business_unit_id INTEGER NOT NULL,
    FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE CASCADE
  );

  -- 3. Users Table (No emails required, login via username/staff ID)
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    business_unit_id INTEGER NOT NULL,
    department_id INTEGER NOT NULL,
    role TEXT CHECK(role IN ('USER', 'AGENT', 'ADMIN')) DEFAULT 'USER',
    must_change_password BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_unit_id) REFERENCES business_units(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
  );
`);

console.log("✅ SQLite Schema initialized (tickets.db)");

module.exports = db;
