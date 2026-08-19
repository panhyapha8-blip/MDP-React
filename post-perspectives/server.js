const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const postsRouter = require("./routes/posts");
const engagementRouter = require("./routes/engagement");
const eventsRouter = require("./routes/events");
const messagesRouter = require("./routes/messages");
const authRouter = require("./routes/auth");

const app = express();
app.use(cors({ exposedHeaders: ["X-Total-Count"] }));
app.use(express.json({ limit: "5mb" })); // ធំជាងធម្មតាបន្តិច ព្រោះ avatar base64 អាចធំ

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/posts", postsRouter);
app.use("/api/engagement", engagementRouter);
app.use("/api/events", eventsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/auth", authRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});