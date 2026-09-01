const express = require("express");
const router = express.Router();
const adminController = require("../controllers/AdminController.js");
const verifyAdminToken = require("../middlewares/AuthMiddleware.js");

router.get("/stats", verifyAdminToken, adminController.getStats);
router.get("/winners/latest", verifyAdminToken, adminController.getWinnersAdmin);
router.get("/peserta", verifyAdminToken, adminController.getPeserta);
router.delete("/peserta/:id_user", verifyAdminToken, adminController.deletePeserta);
router.get("/hadiah", verifyAdminToken, adminController.getHadiah);
router.post("/resetevent", verifyAdminToken, adminController.resetEvent);
router.get("/divisi", verifyAdminToken, adminController.getDivisi);
router.get("/peserta-paged", verifyAdminToken, adminController.getPesertaPaged);
router.post("/peserta", verifyAdminToken, adminController.addPeserta);
router.put("/peserta/:id_user", verifyAdminToken, adminController.editPeserta);
router.post("/peserta/reset-all", verifyAdminToken, adminController.resetAllPeserta);
router.get("/pemenang-paged", verifyAdminToken, adminController.getPemenangPaged);
router.delete("/pemenang/:id_pemenang/diskualifikasi", verifyAdminToken, adminController.diskualifikasiPemenang);

module.exports = router;