// backend/routes/auth.js
//
// Auth API — replaces localStorage-based useAuth logic.
// Passwords are hashed with bcrypt before storage.
//
// Install dependency first:
//   npm install bcryptjs
//
// Mount in server.js:
//   const authRouter = require("./routes/auth");
//   app.use("/api/auth", authRouter);

const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const db = require("../db/connection");

function sanitizeUser(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
}

// ---------- POST /signup — បង្កើតគណនីថ្មី ----------
router.post("/signup", async (req, res) => {
  try {
    const { fullname, email, password } = req.body;
    if (!fullname || !email || !password) {
      return res.status(400).json({ error: "Fill Blanks" });
    }

    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "This email is already registered!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)",
      [fullname, email, hashedPassword]
    );

    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
    res.status(201).json({ user: sanitizeUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Creating Profile!" });
  }
});

// ---------- POST /signin — ចូលគណនី (ដោយ email ឬ fullname) ----------
router.post("/signin", async (req, res) => {
  try {
    const { nameEmail, password } = req.body;
    if (!nameEmail || !password) {
      return res.status(400).json({ error: "Enter your name/email and password" });
    }

    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? OR fullname = ?",
      [nameEmail, nameEmail]
    );

    let matched = null;
    for (const u of rows) {
      const isMatch = await bcrypt.compare(password, u.password);
      if (isMatch) {
        matched = u;
        break;
      }
    }

    if (!matched) {
      return res.status(401).json({ error: "Name/Email or Password is incorrect!" });
    }

    res.json({ user: sanitizeUser(matched) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Logging in!" });
  }
});

// ---------- PUT /profile — កែប្រែឈ្មោះ/ពាក្យសម្ងាត់ ----------
router.put("/profile", async (req, res) => {
  try {
    const { email, fullname, password } = req.body;
    if (!email) return res.status(400).json({ error: "Need Email" });

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(404).json({ error: "No Finding!" });

    let hashedPassword = rows[0].password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    await db.query(
      "UPDATE users SET fullname = ?, password = ? WHERE email = ?",
      [fullname || rows[0].fullname, hashedPassword, email]
    );

    const [updated] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    res.json({ user: sanitizeUser(updated[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Updating Profile!" });
  }
});

// ---------- PUT /avatar — ដាក់/ប្តូររូបភាព Avatar ----------
router.put("/avatar", async (req, res) => {
  try {
    const { email, avatar } = req.body;
    if (!email || !avatar) return res.status(400).json({ error: "Need Email and Avatar" });

    await db.query("UPDATE users SET avatar = ? WHERE email = ?", [avatar, email]);
    res.json({ message: "Succeeded" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Storing Image!" });
  }
});

module.exports = router;

