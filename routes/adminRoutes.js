const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const verifyAdminToken = require("../middlewares/authMiddleware");

router.get("/stats", verifyAdminToken, adminController.getStats);
router.get("/winners/latest", verifyAdminToken, adminController.getWinnersAdmin);
router.get("/peserta", verifyAdminToken, adminController.getPeserta);
router.delete("/peserta/:id_user", verifyAdminToken, adminController.deletePeserta);
router.get("/hadiah", verifyAdminToken, adminController.getHadiah);
router.post("/resetevent", verifyAdminToken, adminController.resetEvent);

module.exports = router;