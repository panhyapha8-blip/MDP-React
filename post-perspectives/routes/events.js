// backend/routes/events.js
//
// CRUD API for personal calendar events, scoped by owner_email.
//
// Mount in server.js:
//   const eventsRouter = require("./routes/events");
//   app.use("/api/events", eventsRouter);

const express = require("express");
const router = express.Router();
const db = require("../db/connection");

// ---------- GET /?owner_email=...&month=7&year=2026 ----------
router.get("/", async (req, res) => {
  try {
    const { owner_email, month, year } = req.query;
    if (!owner_email) return res.status(400).json({ error: "Need Email" });

    let query = "SELECT * FROM calendar_events WHERE owner_email = ?";
    const params = [owner_email];

    if (month && year) {
      query += " AND MONTH(event_date) = ? AND YEAR(event_date) = ?";
      params.push(month, year);
    }
    query += " ORDER BY event_date ASC";

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Storing Event!" });
  }
});

// ---------- POST / — បង្កើតព្រឹត្តិការណ៍ថ្មី ----------
router.post("/", async (req, res) => {
  try {
    const { owner_email, event_date, title, note } = req.body;

    if (!owner_email || !event_date || !title) {
      return res.status(400).json({ error: "Complete Date and Title!" });
    }

    const [result] = await db.query(
      "INSERT INTO calendar_events (owner_email, event_date, title, note) VALUES (?, ?, ?, ?)",
      [owner_email, event_date, title, note || null]
    );

    const [newEvent] = await db.query("SELECT * FROM calendar_events WHERE id = ?", [result.insertId]);
    res.status(201).json(newEvent[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Creating Event" });
  }
});

// ---------- DELETE /:id — លុបព្រឹត្តិការណ៍ (តែម្ចាស់ផ្ទាល់) ----------
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { owner_email } = req.body;

    const [rows] = await db.query("SELECT * FROM calendar_events WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Event is not found!" });
    if (rows[0].owner_email !== owner_email) {
      return res.status(403).json({ error: "Failed Deleting Event!" });
    }

    await db.query("DELETE FROM calendar_events WHERE id = ?", [id]);
    res.json({ message: "Succeeded Deleting Event" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Deleting Event" });
  }
});

module.exports = router;
