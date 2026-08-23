const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/divisi", userController.getDivisi);
router.post("/checkin", userController.checkIn); 
router.post("/autofill", userController.autofill);
router.post("/logout", userController.logout);
router.get('/active', userController.getActive);

module.exports = router;