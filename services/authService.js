const { queryAsync } = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "secret";

const loginAdmin = async (username, password) => {
  const sql = "SELECT * FROM admin WHERE username = ?";
  const results = await queryAsync(sql, [username]);
  
  if (results.length === 0) throw new Error("Username salah atau tidak terdaftar");

  const dataAdmin = results[0];
  const isMatch = await bcrypt.compare(password, dataAdmin.password);
  
  if (!isMatch) throw new Error("Password salah!");

  const token = jwt.sign(
    { id_admin: dataAdmin.id_admin, username: dataAdmin.username },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  return token;
};

module.exports = { loginAdmin };