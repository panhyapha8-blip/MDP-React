const mysql = require("mysql2");
const path = require("path");
// ត្រូវប្រាកដថា .env ត្រូវបានផ្ទុកពី folder របស់ backend ខ្លួនឯង
// មិនមែនធៀបនឹង folder ដែល Node ត្រូវបានហៅឲ្យរត់ (cwd) ទេ
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "modern_perspectives",
});

module.exports = pool.promise();