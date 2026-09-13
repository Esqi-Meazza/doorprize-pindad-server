const jwt = require('jsonwebtoken');

const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Admin token is missing',
    });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Admin token is invalid or expired',
    });
  }
};

module.exports = verifyAdminToken;
