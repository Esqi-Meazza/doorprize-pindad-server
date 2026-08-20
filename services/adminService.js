const { queryAsync } = require("../config/db");

const getDashboardStats = async () => {
  // Menggunakan Promise.all agar 3 query ini berjalan bersamaan (paralel) = Lebih Cepat!
  const qPeserta = "SELECT COUNT(*) AS totalPeserta FROM users";
  const qHadiah = "SELECT SUM(stok) AS totalHadiah FROM hadiah WHERE tipe = 'prize'";
  const qPemenang = "SELECT COUNT(id_user) AS totalPemenang FROM pemenang";

  const [res1, res2, res3] = await Promise.all([
    queryAsync(qPeserta),
    queryAsync(qHadiah),
    queryAsync(qPemenang)
  ]);

  return {
    totalPeserta: res1[0].totalPeserta || 0,
    totalHadiahTersedia: res2[0].totalHadiah || 0,
    totalPemenang: res3[0].totalPemenang || 0
  };
};

const getLatestWinnersAdmin = async () => {
  const sql = `
    SELECT u.nama_lengkap, h.nama_hadiah 
    FROM pemenang p
    JOIN users u ON p.id_user = u.id_user
    JOIN hadiah h ON p.id_hadiah = h.id_hadiah
    ORDER BY p.id_pemenang ASC
    LIMIT 10
  `;
  return await queryAsync(sql);
};

const getAllPeserta = async () => {
  const sql = `
    SELECT u.id_user, u.nip, u.nama_lengkap, u.status_menang, d.nama_divisi 
    FROM users u
    LEFT JOIN divisi d ON u.id_divisi = d.id_divisi
    ORDER BY u.nip ASC
  `;
  return await queryAsync(sql);
};

const deletePesertaById = async (id) => {
  const sql = "DELETE FROM users WHERE users.id_user = ?";
  return await queryAsync(sql, [id]);
};

const getSemuaHadiah = async () => {
  const sql = "SELECT id_hadiah, nama_hadiah, tipe, stok FROM hadiah ORDER BY tipe ASC, id_hadiah ASC";
  return await queryAsync(sql);
};

const resetAllData = async () => {
  await queryAsync("DELETE FROM pemenang");

  await queryAsync(`
    UPDATE users
    SET status_menang = 'belum'
    WHERE status_menang = 'sudah'
  `);

  await queryAsync(`
    UPDATE hadiah
    SET stok_sisa = stok_total
  `);

  await queryAsync(`
    UPDATE kelompok_hadiah 
    SET status_sesi = 'pending' 
    WHERE status_sesi = 'complate'
  `)

  return { message: "Database berhasil di-reset" };
};

module.exports = {
  getDashboardStats,
  getLatestWinnersAdmin,
  getAllPeserta,
  deletePesertaById,
  getSemuaHadiah,
  resetAllData
};