const adminService = require("../services/AdminService.js");

const getStats = async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getWinnersAdmin = async (req, res) => {
  try {
    const winners = await adminService.getLatestWinnersAdmin();
    res.status(200).json({ success: true, data: winners });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getPeserta = async (req, res) => {
  try {
    const peserta = await adminService.getAllPeserta();
    res.status(200).json({ success: true, data: peserta });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const deletePeserta = async (req, res) => {
  try {
    const id = req.params.id_user;
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ success: false, error: "ID peserta tidak valid" });
    }

    const result = await adminService.deletePesertaById(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Peserta tidak ditemukan" });
    }

    res.status(200).json({ success: true, message: "Peserta berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getHadiah = async (req, res) => {
  try {
    const hadiah = await adminService.getSemuaHadiah();
    res.status(200).json({ success: true, data: hadiah });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const resetEvent = async (req, res) => {
  try {
    await adminService.resetAllData();
    res.status(200).json({ success: true, message: "Database sukses di-reset seperti semula! Siap testing lagi!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Gagal melakukan reset database" });
  }
};

module.exports = {
  getStats,
  getWinnersAdmin,
  getPeserta,
  deletePeserta,
  getHadiah,
  resetEvent
};