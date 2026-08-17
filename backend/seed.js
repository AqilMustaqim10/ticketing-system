// backend/seed.js
const db = require("./db");
const bcrypt = require("bcryptjs");

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // 1. Insert Business Units
    const insertBU = db.prepare(
      "INSERT OR IGNORE INTO business_units (name) VALUES (?)",
    );
    insertBU.run("Hotel");
    insertBU.run("CCEC");
    insertBU.run("FNB");

    // Fetch BU IDs
    const hotel = db
      .prepare("SELECT id FROM business_units WHERE name = ?")
      .get("Hotel");
    const ccec = db
      .prepare("SELECT id FROM business_units WHERE name = ?")
      .get("CCEC");
    const fnb = db
      .prepare("SELECT id FROM business_units WHERE name = ?")
      .get("FNB");

    // 2. Insert Departments
    const insertDept = db.prepare(
      "INSERT OR IGNORE INTO departments (name, business_unit_id) VALUES (?, ?)",
    );

    // Hotel Departments
    insertDept.run("Front Office", hotel.id);
    insertDept.run("Housekeeping", hotel.id);
    insertDept.run("Hotel IT", hotel.id);

    // CCEC Departments
    insertDept.run("Event Operations", ccec.id);
    insertDept.run("AV Support", ccec.id);
    insertDept.run("CCEC IT", ccec.id);

    // FNB Departments
    insertDept.run("Kitchen / Culinary", fnb.id);
    insertDept.run("POS & Outlets", fnb.id);
    insertDept.run("FNB IT", fnb.id);

    // Get IT Admin Dept ID for initial admin
    const adminDept = db
      .prepare("SELECT id FROM departments WHERE name = ?")
      .get("Hotel IT");

    // 3. Create Default Admin User
    const adminUsername = "admin";
    const rawPassword = "Admin@1234";
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const insertAdmin = db.prepare(`
      INSERT OR IGNORE INTO users 
      (full_name, username, password_hash, business_unit_id, department_id, role, must_change_password)
      VALUES (?, ?, ?, ?, ?, 'ADMIN', 0)
    `);

    insertAdmin.run(
      "Global IT Administrator",
      adminUsername,
      passwordHash,
      hotel.id,
      adminDept.id,
    );

    console.log("✅ Database Seeding Complete!");
    console.log("-------------------------------------------");
    console.log("🔑 Default Admin Login Credentials:");
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${rawPassword}`);
    console.log("-------------------------------------------");
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
  }
}

seed();
