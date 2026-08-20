const adminService = require("../services/adminService");

const getStats = async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getWinnersAdmin = async (req, res) => {
  try {
    const winners = await adminService.getLatestWinnersAdmin();
    res.json(winners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPeserta = async (req, res) => {
  try {
    const peserta = await adminService.getAllPeserta();
    res.json(peserta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deletePeserta = async (req, res) => {
  try {
    const id = req.params.id_user;

    console.log("ID yang mau dihapus:", id);

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "ID peserta tidak valid" });
    }

    const result = await adminService.deletePesertaById(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Peserta tidak ditemukan" });
    }

    res.json({ message: "Peserta berhasil dihapus" });

  } catch (err) {
    console.error("DELETE PESERTA ERROR:", err);

    res.status(500).json({
      error: err.message
    });
  }
};

const getHadiah = async (req, res) => {
  try {
    const hadiah = await adminService.getSemuaHadiah();
    res.json(hadiah);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const resetEvent = async (req, res) => {
  try {
    await adminService.resetAllData();
    res.json({ message: "Database sukses di-reset seperti semula! Siap testing lagi!" });
  } catch (error) {
    console.error("RESET EVENT ERROR:", error);
    res.status(500).json({ error: error.message || "Gagal melakukan reset database" });
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