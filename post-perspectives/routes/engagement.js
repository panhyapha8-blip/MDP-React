// backend/routes/engagement.js
//
// Generic Like/Comment API — works for scientists (static frontend data)
// AND user posts (database records), keyed by targetType + targetId.
//
// Mount in server.js:
//   const engagementRouter = require("./routes/engagement");
//   app.use("/api/engagement", engagementRouter);

const express = require("express");
const router = express.Router();
const db = require("../db/connection");

// ---------- GET /:targetType/:targetId — ទាញយកចំនួន Like ----------
router.get("/:targetType/:targetId", async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const [rows] = await db.query(
      "SELECT likes FROM engagement_likes WHERE target_type = ? AND target_id = ?",
      [targetType, targetId]
    );
    res.json({ likes: rows.length > 0 ? rows[0].likes : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Storing Like's Quantity!" });
  }
});

// ---------- POST /:targetType/:targetId/like — បន្ថែម Like ម្តង ----------
router.post("/:targetType/:targetId/like", async (req, res) => {
  try {
    const { targetType, targetId } = req.params;

    // UPSERT: បើមានស្រាប់ បង្កើន likes+1, បើមិនទាន់មាន បង្កើតថ្មីជាមួយ likes=1
    await db.query(
      `INSERT INTO engagement_likes (target_type, target_id, likes)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE likes = likes + 1`,
      [targetType, targetId]
    );

    const [rows] = await db.query(
      "SELECT likes FROM engagement_likes WHERE target_type = ? AND target_id = ?",
      [targetType, targetId]
    );
    res.json({ likes: rows[0].likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Liking!" });
  }
});

// ---------- POST /:targetType/:targetId/unlike — ដក Like ចេញវិញ ----------
router.post("/:targetType/:targetId/unlike", async (req, res) => {
  try {
    const { targetType, targetId } = req.params;

    await db.query(
      `UPDATE engagement_likes
       SET likes = GREATEST(likes - 1, 0)
       WHERE target_type = ? AND target_id = ?`,
      [targetType, targetId]
    );

    const [rows] = await db.query(
      "SELECT likes FROM engagement_likes WHERE target_type = ? AND target_id = ?",
      [targetType, targetId]
    );
    res.json({ likes: rows.length > 0 ? rows[0].likes : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Unliking!" });
  }
});

// ---------- GET /:targetType/:targetId/comments — ទាញយកមតិយោបល់ ----------
router.get("/:targetType/:targetId/comments", async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM engagement_comments WHERE target_type = ? AND target_id = ? ORDER BY created_at ASC",
      [targetType, targetId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Storing Comment!" });
  }
});

// ---------- POST /:targetType/:targetId/comments — បន្ថែមមតិយោបល់ថ្មី ----------
router.post("/:targetType/:targetId/comments", async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const { commenter_name, comment_text, commenter_email } = req.body;

    if (!commenter_name || !comment_text) {
      return res.status(400).json({ error: "Fill Name and Comment!" });
    }

    const [result] = await db.query(
      "INSERT INTO engagement_comments (target_type, target_id, commenter_name, comment_text, commenter_email) VALUES (?, ?, ?, ?, ?)",
      [targetType, targetId, commenter_name, comment_text, commenter_email || null]
    );

    const [newComment] = await db.query(
      "SELECT * FROM engagement_comments WHERE id = ?",
      [result.insertId]
    );
    res.status(201).json(newComment[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Commenting!" });
  }
});

// ---------- DELETE /comments/:commentId — លុបមតិយោបល់
// អនុញ្ញាតតែម្ចាស់ Post ដើម (post owner) ឬអ្នកសរសេរមតិយោបល់ផ្ទាល់ (commenter) ប៉ុណ្ណោះ ----------
router.delete("/comments/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    const { requester_email } = req.body;

    const [rows] = await db.query("SELECT * FROM engagement_comments WHERE id = ?", [commentId]);
    if (rows.length === 0) return res.status(404).json({ error: "Comment is not found!" });
    const comment = rows[0];

    let isOwner = false;
    if (comment.target_type === "post" && requester_email) {
      const [postRows] = await db.query("SELECT owner_email FROM posts WHERE id = ?", [comment.target_id]);
      if (postRows.length > 0 && postRows[0].owner_email && postRows[0].owner_email === requester_email) {
        isOwner = true;
      }
    }

    const isCommenter = comment.commenter_email && requester_email && comment.commenter_email === requester_email;

    if (!isOwner && !isCommenter) {
      return res.status(403).json({ error: "Not Allowed Deleting Comment!" });
    }

    await db.query("DELETE FROM engagement_comments WHERE id = ?", [commentId]);
    res.json({ message: "Succeeded Deleting Comment!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Deleting Comment!" });
  }
});

module.exports = router;