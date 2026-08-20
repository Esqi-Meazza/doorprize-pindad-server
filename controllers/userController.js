const userService = require("../services/userService");

const getDivisi = async (req, res) => {
  try {
    const results = await userService.getDivisi();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data divisi" });
  }
};

const checkIn = async (req, res) => {
  try {
    const { nip, tgl_lahir } = req.body;

    // Validasi input kosong
    if (!nip || !tgl_lahir) {
      return res.status(400).json({ error: "NIP dan Tanggal Lahir wajib diisi!" });
    }

    // Panggil service
    const dataPegawai = await userService.checkInPegawai(nip, tgl_lahir);
    
    // Kirim respons sukses beserta data untuk autofill
    res.json({ message: "Login Berhasil!", data: dataPegawai });

  } catch (err) {
    // Tentukan HTTP status code berdasarkan pesan error
    let status = 500;
    if (err.message.includes("sudah digunakan")) status = 409;
    if (err.message.includes("tidak sesuai")) status = 404;

    res.status(status).json({ error: err.message });
  }
};

const getActive = async (req, res) => {
    try {
        const participants = await userService.getActiveParticipants();
        res.status(200).json({ data: participants });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const autofill = async (req, res) => {
  try {
    const { nip, tgl_lahir } = req.body;
    const data = await userService.cariPegawai(nip, tgl_lahir);
    res.json({ data });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

const logout = async (req, res) => {
  try {
    const { id_user } = req.body;

    if (!id_user) {
      return res.status(400).json({
        error: "id_user wajib dikirim"
      });
    }

    const result = await userService.logoutPegawai(id_user);

    res.status(200).json(result);

  } catch (error) {
    console.error("Logout error:", error);

    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = { getDivisi, checkIn, autofill, logout, getActive };