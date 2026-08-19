// backend/routes/posts.js
//
// CRUD API for user-created "Perspective" posts (photo + slogan + short bio),
// plus Like and Comment endpoints.

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

const db = require("../db/connection");

// ---------- Multer setup for image uploads ----------
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Image: JPG, PNG, WEBP, or GIF"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// ---------- GET all posts (supports ?search=&page=&limit=&owner_email=) ----------
router.get("/", async (req, res) => {
  try {
    // req.query values can technically arrive as arrays (e.g. ?search=a&search=b)
    // — normalize to a single string so downstream code never trips on that.
    const rawSearch = req.query.search;
    const search = Array.isArray(rawSearch) ? rawSearch[0] : rawSearch || "";
    const { page, limit, owner_email } = req.query;

    const conditions = [];
    const params = [];

    const term = search.trim();
    if (term) {
      // Wrap both sides in LOWER() so the match is case-insensitive
      // regardless of the table's collation.
      const likeTerm = `%${term.toLowerCase()}%`;
      conditions.push(
        "(LOWER(author_name) LIKE ? OR LOWER(slogan) LIKE ? OR LOWER(description) LIKE ?)"
      );
      params.push(likeTerm, likeTerm, likeTerm);
    }
    if (owner_email) {
      conditions.push("owner_email = ?");
      params.push(owner_email);
    }

    const whereClause = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";

    // Temporary debug logging — remove once search is confirmed working.
    // console.log("[GET /api/posts] search:", JSON.stringify(term), "owner_email:", owner_email);
    // console.log("[GET /api/posts] WHERE:", whereClause, "params:", params);

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM posts${whereClause}`,
      params
    );
    const total = countRows[0].total;

    let query = `SELECT * FROM posts${whereClause} ORDER BY created_at DESC`;
    const queryParams = [...params];

    // Pagination only kicks in if page or limit is explicitly passed —
    // existing callers with no query params still get the full array,
    // unchanged from before.
    if (page || limit) {
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);
      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      query += " LIMIT ? OFFSET ?";
      queryParams.push(limitNum, (pageNum - 1) * limitNum);
    }

    const [rows] = await db.query(query, queryParams);
    console.log(`[GET /api/posts] matched ${total} row(s), returning ${rows.length}`);

    res.set("X-Total-Count", String(total));
    res.json(rows);
  } catch (err) {
    console.error("[GET /api/posts] error:", err);
    res.status(500).json({ error: "Failed Storing Post!" });
  }
});

// ---------- GET single post ----------
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM posts WHERE id = ?", [req.params.id]);
    if (rows.length === 0) {
      // Instead of 404, return a safe placeholder object
      return res.json({
        id: "placeholder",
        author_name: "Unknown Author",
        slogan: "No slogan available",
        description: "This post does not exist. Showing placeholder content.",
        image_url: "/uploads/default.png"
      });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error" });
  }
});


// ---------- CREATE a post ----------
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { author_name, slogan, description, owner_email } = req.body;

    if (!author_name || !slogan || !description) {
      return res.status(400).json({ error: "Fill Name, Slogan, and Describtion!" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Insert Image!" });
    }

    const image_url = `/uploads/${req.file.filename}`;

    const [result] = await db.query(
      "INSERT INTO posts (author_name, slogan, description, image_url, owner_email) VALUES (?, ?, ?, ?, ?)",
      [author_name, slogan, description, image_url, owner_email || null]
    );

    const [newPost] = await db.query("SELECT * FROM posts WHERE id = ?", [result.insertId]);
    res.status(201).json(newPost[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Creating Post!" });
  }
});

// ---------- UPDATE a post ----------
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { author_name, slogan, description } = req.body;
    const { id } = req.params;

    const [existingRows] = await db.query("SELECT * FROM posts WHERE id = ?", [id]);
    if (existingRows.length === 0) return res.status(404).json({ error: "Post is not found!" });

    let image_url = existingRows[0].image_url;
    if (req.file) {
      const oldPath = path.join(UPLOAD_DIR, path.basename(image_url));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      image_url = `/uploads/${req.file.filename}`;
    }

    await db.query(
      "UPDATE posts SET author_name = ?, slogan = ?, description = ?, image_url = ? WHERE id = ?",
      [author_name, slogan, description, image_url, id]
    );

    const [updated] = await db.query("SELECT * FROM posts WHERE id = ?", [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Updating Post!" });
  }
});

// ---------- DELETE a post ----------
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM posts WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Post is not found!" });

    const imgPath = path.join(UPLOAD_DIR, path.basename(rows[0].image_url));
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);

    await db.query("DELETE FROM posts WHERE id = ?", [id]);
    res.json({ message: "Succeedded Deleting Post!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Deleting Post!" });
  }
});

// ==================== LIKE ====================

// ---------- POST /:id/like — បន្ថែម like ម្តង ----------
router.post("/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query("SELECT id FROM posts WHERE id = ?", [id]);
    if (existing.length === 0) return res.status(404).json({ error: "Post is not found!" });

    await db.query("UPDATE posts SET likes = likes + 1 WHERE id = ?", [id]);
    const [rows] = await db.query("SELECT likes FROM posts WHERE id = ?", [id]);
    res.json({ likes: rows[0].likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Liking!" });
  }
});

// ==================== COMMENTS ====================

// ---------- GET /:id/comments — ទាញយកមតិយោបល់ទាំងអស់របស់ Post មួយ ----------
router.get("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC",
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Storing Comment!" });
  }
});

// ---------- POST /:id/comments — បន្ថែមមតិយោបល់ថ្មី ----------
router.post("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { commenter_name, comment_text } = req.body;

    if (!commenter_name || !comment_text) {
      return res.status(400).json({ error: "Complete Name and Comment" });
    }

    const [postCheck] = await db.query("SELECT id FROM posts WHERE id = ?", [id]);
    if (postCheck.length === 0) return res.status(404).json({ error: "Post is not found!" });

    const [result] = await db.query(
      "INSERT INTO comments (post_id, commenter_name, comment_text) VALUES (?, ?, ?)",
      [id, commenter_name, comment_text]
    );

    const [newComment] = await db.query("SELECT * FROM comments WHERE id = ?", [result.insertId]);
    res.status(201).json(newComment[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Commenting!" });
  }
});

// ---------- DELETE /comments/:commentId — លុបមតិយោបល់ (ស្រេចចិត្ត) ----------
router.delete("/comments/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    await db.query("DELETE FROM comments WHERE id = ?", [commentId]);
    res.json({ message: "Succeeded Deleting Comment!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed Deleting Comment!" });
  }
});

module.exports = router;
