require("dotenv").config();
const mysql = require("mysql2");

const connectionLimit = Number(process.env.DB_CONNECTION_LIMIT || 10);
const queueLimit = Number(process.env.DB_QUEUE_LIMIT || 0);
const connectTimeout = Number(process.env.DB_CONNECT_TIMEOUT || 10000);

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "db_spinwheel",
  waitForConnections: true,
  connectionLimit,
  queueLimit,
  connectTimeout,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Helper untuk mengubah db.query (callback) menjadi Promise (async/await)
const queryAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

module.exports = { db, queryAsync };