const express = require("express");
const router = express.Router();
const adminController = require("../controllers/AdminController.js");
const verifyAdminToken = require("../middlewares/AuthMiddleware.js");
const validate = require("../middlewares/validate");
const {
	pagedPesertaSchema,
	pagedPemenangSchema,
	pagedHadiahSchema,
	pagedKelompokSchema,
} = require("../schemas/requestSchemas");

// dashboard
router.get("/stats", verifyAdminToken, adminController.getStats);
router.get("/winners/latest", verifyAdminToken, adminController.getWinnersAdmin);
// peserta
router.delete("/peserta/:id_user", verifyAdminToken, adminController.deletePeserta);
router.get("/peserta", verifyAdminToken, adminController.getPeserta);
router.get("/divisi", verifyAdminToken, adminController.getDivisi);
router.get("/peserta-paged", verifyAdminToken, validate(pagedPesertaSchema, "query"), adminController.getPesertaPaged);
router.post("/peserta", verifyAdminToken, adminController.addPeserta);
router.put("/peserta/:id_user", verifyAdminToken, adminController.editPeserta);
router.post("/peserta/reset-all", verifyAdminToken, adminController.resetAllPeserta);
// pemenang
router.get("/pemenang-paged", verifyAdminToken, validate(pagedPemenangSchema, "query"), adminController.getPemenangPaged);
router.delete("/pemenang/:id_pemenang/diskualifikasi", verifyAdminToken, adminController.diskualifikasiPemenang);
//hadiah
router.get("/hadiah", verifyAdminToken, adminController.getHadiah); // Dipakai untuk Dropdown
router.get("/hadiah-paged", verifyAdminToken, validate(pagedHadiahSchema, "query"), adminController.getHadiahPaged); // Dipakai untuk Tabel
router.post("/hadiah", verifyAdminToken, adminController.tambahHadiah);
router.put("/hadiah/:id_hadiah", verifyAdminToken, adminController.editHadiah);
router.delete("/hadiah/:id_hadiah", verifyAdminToken, adminController.hapusHadiah);
// Kelompok Hadiah
router.get("/kelompok", verifyAdminToken, adminController.getSemuaKelompok);
router.get("/kelompok-paged", verifyAdminToken, validate(pagedKelompokSchema, "query"), adminController.getKelompokPaged);
router.post("/kelompok", verifyAdminToken, adminController.tambahKelompok);
router.put("/kelompok/:id_kelompok", verifyAdminToken, adminController.editKelompok);
router.delete("/kelompok/:id_kelompok", verifyAdminToken, adminController.hapusKelompok);
// setting
router.post("/resetevent", verifyAdminToken, adminController.resetEvent);

module.exports = router;