const authService = require("../services/authService");

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const token = await authService.loginAdmin(username, password);
    res.json({ message: "Login berhasil", token });
  } catch (error) {
    res.status(401).json({ error: error.message || "Terjadi kesalahan server" });
  }
};

module.exports = { login };