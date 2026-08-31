const express = require("express");
const router = express.Router();
const adminController = require("../controllers/AdminController.js");
const verifyAdminToken = require("../middlewares/AuthMiddleware.js");

// Endpoint Lama (Existing)
router.get("/stats", verifyAdminToken, adminController.getStats);
router.get("/winners/latest", verifyAdminToken, adminController.getWinnersAdmin);
router.get("/peserta", verifyAdminToken, adminController.getPeserta); // (Optional: Bisa dihapus nanti kalau sudah 100% pakai paged)
router.delete("/peserta/:id_user", verifyAdminToken, adminController.deletePeserta);
router.get("/hadiah", verifyAdminToken, adminController.getHadiah);
router.post("/resetevent", verifyAdminToken, adminController.resetEvent);

// Endpoint Baru (Pagination, Filter, CRUD Peserta Baru)
router.get("/divisi", verifyAdminToken, adminController.getDivisi);
router.get("/peserta-paged", verifyAdminToken, adminController.getPesertaPaged);
router.post("/peserta", verifyAdminToken, adminController.addPeserta);
router.put("/peserta/:id_user", verifyAdminToken, adminController.editPeserta);
router.post("/peserta/reset-all", verifyAdminToken, adminController.resetAllPeserta);

module.exports = router;