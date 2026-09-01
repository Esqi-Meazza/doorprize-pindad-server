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

const resetEvent = async (req, res) => {
  try {
    await adminService.resetAllData();
    res.status(200).json({ success: true, message: "Database sukses di-reset seperti semula! Siap testing lagi!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Gagal melakukan reset database" });
  }
};

// ==========================================
// FITUR BARU: MANAJEMEN PESERTA (PAGINATION)
// ==========================================

const getDivisi = async (req, res) => {
  try {
    const data = await adminService.getDivisiList();
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getPesertaPaged = async (req, res) => {
  try {
    const { page, limit, search, divisi } = req.query;
    const result = await adminService.getPesertaPaged({ page, limit, search, divisi });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const addPeserta = async (req, res) => {
  try {
    const { nip, nama_lengkap, tgl_lahir, id_divisi } = req.body;
    if (!nip || !nama_lengkap || !id_divisi) {
      return res.status(400).json({ success: false, error: "Semua field wajib diisi!" });
    }await adminService.createPeserta({ nip, nama_lengkap, tgl_lahir, id_divisi });
    res.status(201).json({ success: true, message: "Peserta berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const editPeserta = async (req, res) => {
  try {
    const { id_user } = req.params;
    const { nip, nama_lengkap, tgl_lahir, id_divisi, status_terdaftar, status_menang } = req.body;

    if (!nip || !nama_lengkap || !id_divisi) {
      return res.status(400).json({ success: false, error: "NIP, nama, dan divisi wajib diisi" });
    }

    await adminService.updatePeserta(id_user, {
      nip,
      nama_lengkap,
      tgl_lahir,
      id_divisi,
      status_terdaftar,
      status_menang,
    });

    res.status(200).json({ success: true, message: "Data peserta berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const resetAllPeserta = async (req, res) => {
  try {
    const { confirm_keyword } = req.body;
    if (confirm_keyword !== "RESET-SEMUA") {
      return res.status(400).json({ success: false, error: "Kata kunci konfirmasi salah!" });
    }
    await adminService.deleteAllPeserta();
    res.status(200).json({ success: true, message: "Seluruh data peserta berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// FITUR BARU: MANAJEMEN PEMENANG
// ==========================================

const getPemenangPaged = async (req, res) => {
  try {
    const { page, limit, search, hadiah } = req.query;
    const result = await adminService.getPemenangPaged({ page, limit, search, hadiah });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const diskualifikasiPemenang = async (req, res) => {
  try {
    const { id_pemenang } = req.params;
    if (!id_pemenang) {
      return res.status(400).json({ success: false, error: "ID Pemenang tidak valid" });
    }
    
    const result = await adminService.diskualifikasiPemenang(id_pemenang);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// FITUR: MANAJEMEN HADIAH
// ==========================================

const getHadiah = async (req, res) => {
  try {
    const hadiah = await adminService.getSemuaHadiah();
    res.status(200).json({ success: true, data: hadiah });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getHadiahPaged = async (req, res) => {
  try {
    const { page, limit, search, tipe } = req.query;
    const result = await adminService.getHadiahPaged({ page, limit, search, tipe });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const tambahHadiah = async (req, res) => {
  try {
    const result = await adminService.tambahHadiah(req.body);
    res.status(201).json({ success: true, message: result.message });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const editHadiah = async (req, res) => {
  try {
    const { id_hadiah } = req.params;
    const result = await adminService.editHadiah(id_hadiah, req.body);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message }); // 400 untuk validasi stok minus
  }
};

const hapusHadiah = async (req, res) => {
  try {
    const { id_hadiah } = req.params;
    const result = await adminService.hapusHadiah(id_hadiah);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message }); // 400 untuk proteksi foreign key
  }
};

module.exports = {
  getStats,
  getWinnersAdmin,
  getPeserta,
  deletePeserta,
  resetEvent,
  getDivisi,
  getPesertaPaged,
  addPeserta,
  editPeserta,
  resetAllPeserta,
  getPemenangPaged,
  diskualifikasiPemenang,
  getHadiah,
  getHadiahPaged,
  tambahHadiah,
  editHadiah,
  hapusHadiah
};