// backend/routes/messages.js
//
// Direct Message API between users, keyed by email.
// Now supports sending an image alongside or instead of text.
//
// Mount in server.js:
//   const messagesRouter = require("./routes/messages");
//   app.use("/api/messages", messagesRouter);

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const db = require("../db/connection");

// ---------- Multer setup for message image uploads ----------
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueName = `msg-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Image: JPG, PNG, WEBP or GIF"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// ---------- GET /conversations?email=me@x.com — បញ្ជីអ្នកសន្ទនាទាំងអស់ ----------
router.get("/conversations", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Need Email" });

    const [partners] = await db.query(
      `SELECT
         CASE WHEN sender_email = ? THEN receiver_email ELSE sender_email END AS partner,
         MAX(created_at) AS last_time
       FROM messages
       WHERE sender_email = ? OR receiver_email = ?
       GROUP BY partner
       ORDER BY last_time DESC`,
      [email, email, email]
    );

    const conversations = [];
    for (const p of partners) {
      const [lastMsgRows] = await db.query(
        `SELECT message_text, image_url, sender_email, created_at FROM messages
         WHERE (sender_email = ? AND receiver_email = ?) OR (sender_email = ? AND receiver_email = ?)
         ORDER BY created_at DESC LIMIT 1`,
        [email, p.partner, p.partner, email]
      );
      const [unreadRows] = await db.query(
        `SELECT COUNT(*) AS cnt FROM messages
         WHERE sender_email = ? AND receiver_email = ? AND is_read = FALSE`,
        [p.partner, email]
      );

      const lastMsg = lastMsgRows[0];
      conversations.push({
        partner: p.partner,
        last_message: lastMsg?.message_text || (lastMsg?.image_url ? "Image" : ""),
        last_time: p.last_time,
        unread_count: unreadRows[0].cnt,
      });
    }

    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Pulling Conversation List" });
  }
});

// ---------- GET /thread?me=x@x.com&other=y@y.com — សារទាំងអស់រវាងអ្នកទាំង ២ ----------
router.get("/thread", async (req, res) => {
  try {
    const { me, other } = req.query;
    if (!me || !other) return res.status(400).json({ error: "Need Me and Other" });

    const [rows] = await db.query(
      `SELECT * FROM messages
       WHERE (sender_email = ? AND receiver_email = ?) OR (sender_email = ? AND receiver_email = ?)
       ORDER BY created_at ASC`,
      [me, other, other, me]
    );

    await db.query(
      `UPDATE messages SET is_read = TRUE WHERE sender_email = ? AND receiver_email = ? AND is_read = FALSE`,
      [other, me]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Pulling File!" });
  }
});

// ---------- POST / — ផ្ញើសារថ្មី (អត្ថបទ និង/ឬ រូបភាព) ----------
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { sender_email, receiver_email, message_text } = req.body;

    if (!sender_email || !receiver_email) {
      return res.status(400).json({ error: "Complete Reciever!" });
    }
    if (sender_email === receiver_email) {
      return res.status(400).json({ error: "Cannot Send to Self!" });
    }
    if (!message_text?.trim() && !req.file) {
      return res.status(400).json({ error: "Message or Image" });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await db.query(
      "INSERT INTO messages (sender_email, receiver_email, message_text, image_url) VALUES (?, ?, ?, ?)",
      [sender_email, receiver_email, message_text || null, image_url]
    );

    const [newMsg] = await db.query("SELECT * FROM messages WHERE id = ?", [result.insertId]);
    res.status(201).json(newMsg[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Sending" });
  }
});

// DELETE /api/messages/:id  — លុបសារ (សម្រាប់តែម្ចាស់សារប៉ុណ្ណោះ)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { email } = req.query; // frontend ផ្ញើ email មកជា query param ដើម្បីផ្ទៀងផ្ទាត់

  try {
    const [rows] = await db.query("SELECT * FROM messages WHERE id = ?", [id]);
    const message = rows[0];

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    if (message.sender_email !== email) {
      return res.status(403).json({ error: "You can only delete your own message" });
    }

    // បើសារនោះមានរូបភាព attach — លុបឯកសាររូបភាពចេញពី disk ដែរ
    if (message.image_url) {
      const filePath = path.join(__dirname, "..", message.image_url);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete image file:", err.message);
      });
    }

    await db.query("DELETE FROM messages WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

module.exports = router;

