const mysql = require("mysql2");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "db_spinwheel",
  waitForConnections: true,
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