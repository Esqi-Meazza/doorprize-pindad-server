const { queryAsync } = require("../config/db");

const getDivisi = async () => {
  return await queryAsync("SELECT * FROM divisi");
};

const checkInPegawai = async (nip, tgl_lahir) => {
  const sql = `
    SELECT u.*, d.nama_divisi 
    FROM users u
    LEFT JOIN divisi d ON u.id_divisi = d.id_divisi
    WHERE u.nip = ? AND u.tgl_lahir = ?
  `;
  const existing = await queryAsync(sql, [nip, tgl_lahir]);
  if (existing.length === 0) {
    throw new Error("NIP atau Tanggal Lahir tidak sesuai.");
  }
  const pegawai = existing[0];
  if (pegawai.status_terdaftar === 'sudah') {
    throw new Error("NIP ini sudah digunakan untuk login. Hubungi Panitia jika ini bukan Anda.");
  }
  const updateSql = "UPDATE users SET status_terdaftar = 'sudah' WHERE id_user = ?";
  await queryAsync(updateSql, [pegawai.id_user]);
  return {
    id_user: pegawai.id_user,
    nama_lengkap: pegawai.nama_lengkap,
    nama_divisi: pegawai.nama_divisi
  };
};

const cariPegawai = async (nip, tgl_lahir) => {
  const sql = `
    SELECT u.nama_lengkap, d.nama_divisi 
    FROM users u
    LEFT JOIN divisi d ON u.id_divisi = d.id_divisi
    WHERE u.nip = ? AND u.tgl_lahir = ?
  `;
  const existing = await queryAsync(sql, [nip, tgl_lahir]);

  if (existing.length === 0) {
    throw new Error("Data tidak ditemukan");
  }

  return existing[0];
};

const getActiveParticipants = async () => {
  return await queryAsync(
    "SELECT nama_lengkap FROM users WHERE status_terdaftar = 'sudah' ORDER BY RAND() LIMIT 150"
  );
};

const logoutPegawai = async (id_user) => {
    const sql = `
        UPDATE users
        SET status_terdaftar = 'belum'
        WHERE id_user = ?
    `;

    await queryAsync(sql, [id_user]);

    return {
        message: "Logout berhasil"
    };
};

module.exports = { getDivisi, checkInPegawai, cariPegawai, getActiveParticipants, logoutPegawai };