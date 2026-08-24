const jwt = require("jsonwebtoken");
const JWT_SECRET = "secret"; // Sebaiknya pindahkan ke file .env nanti

const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Akses ditolak! Tiket (Token) tidak ditemukan." });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Sesi telah habis atau token tidak valid." });
    }
    req.admin = decoded;
    next();
  });
};

module.exports = verifyAdminToken;