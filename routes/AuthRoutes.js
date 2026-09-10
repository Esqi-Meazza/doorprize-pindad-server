const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const validate = require("../middlewares/validate");
const { adminLoginSchema } = require("../schemas/requestSchemas");

router.post("/login", validate(adminLoginSchema), authController.login);

module.exports = router;