const { queryAsync } = require("../config/db");

const getDashboardStats = async () => {
  const qPeserta = "SELECT COUNT(*) AS totalPeserta FROM users";
  const qHadiah = "SELECT SUM(stok_total) AS totalHadiah, SUM(stok_sisa) AS sisaHadiah FROM hadiah";
  const qPemenang = "SELECT COUNT(id_user) AS totalPemenang FROM pemenang";
  const qSesi = "SELECT * FROM kelompok_hadiah WHERE status_sesi = 'active' LIMIT 1";

  const [resPeserta, resHadiah, resPemenang, resSesi] = await Promise.all([
    queryAsync(qPeserta),
    queryAsync(qHadiah),
    queryAsync(qPemenang),
    queryAsync(qSesi)
  ]);

  const totalHadiah = resHadiah[0]?.totalHadiah || 0;
  const sisaHadiah = resHadiah[0]?.sisaHadiah || 0;
  const hadiahTerundi = totalHadiah - sisaHadiah;
  const persentaseSelesai = totalHadiah > 0 ? Math.round((hadiahTerundi / totalHadiah) * 100) : 0;

  return {
    totalPeserta: resPeserta[0]?.totalPeserta || 0,
    totalPemenang: resPemenang[0]?.totalPemenang || 0,
    totalHadiahTersedia: totalHadiah,
    hadiahTerundi: hadiahTerundi,
    persentaseSelesai: persentaseSelesai,
    sesiAktif: resSesi[0] || null 
  };
};

const getLatestWinnersAdmin = async () => {
  const sql = `
    SELECT u.nama_lengkap, h.nama_hadiah 
    FROM pemenang p
    JOIN users u ON p.id_user = u.id_user
    JOIN hadiah h ON p.id_hadiah = h.id_hadiah
    ORDER BY p.id_pemenang DESC
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
  `);

  return { message: "Database berhasil di-reset" };
};

const getDivisiList = async () => {
  const sql = "SELECT * FROM divisi ORDER BY nama_divisi ASC";
  return await queryAsync(sql);
};

const getPesertaPaged = async ({ page = 1, limit = 10, search = '', divisi = '' }) => {
  const offset = (Number(page) - 1) * Number(limit);
  const params = [];
  let whereClauses = [];

  if (search) {
    whereClauses.push("(u.nama_lengkap LIKE ? OR u.nip LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  if (divisi) {
    whereClauses.push("u.id_divisi = ?");
    params.push(divisi);
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const countSQL = `SELECT COUNT(*) AS total FROM users u ${whereSQL}`;
  const countResult = await queryAsync(countSQL, params);
  const totalItems = countResult[0]?.total || 0;
  const totalPages = Math.ceil(totalItems / Number(limit)) || 1;

  const dataSQL = `
    SELECT u.id_user, u.nip, u.nama_lengkap, u.tgl_lahir, u.status_terdaftar, u.status_menang, u.id_divisi, d.nama_divisi 
    FROM users u
    LEFT JOIN divisi d ON u.id_divisi = d.id_divisi
    ${whereSQL}
    ORDER BY u.id_user DESC
    LIMIT ? OFFSET ?
  `;
  const data = await queryAsync(dataSQL, [...params, Number(limit), Number(offset)]);

  return {
    data,
    pagination: {
      currentPage: Number(page),
      limit: Number(limit),
      totalItems,
      totalPages
    }
  };
};

const createPeserta = async ({ nip, nama_lengkap, tgl_lahir, id_divisi }) => {
  const tgl = tgl_lahir || null; 
  const sql = "INSERT INTO users (nip, nama_lengkap, tgl_lahir, id_divisi, status_terdaftar, status_menang) VALUES (?, ?, ?, ?, 'belum', 'belum')";
  return await queryAsync(sql, [nip, nama_lengkap, tgl, id_divisi]);
};

const updatePeserta = async (id_user, { nip, nama_lengkap, id_divisi, status_terdaftar, status_menang }) => {
  const sql = `
    UPDATE users 
    SET nip = ?, nama_lengkap = ?, tgl_lahir = ?, id_divisi = ?, status_terdaftar = ?, status_menang = ?
    WHERE id_user = ?
  `;
  return await queryAsync(sql, [nip, nama_lengkap, id_divisi, status_terdaftar, status_menang, id_user]);
};

const deleteAllPeserta = async () => {
  const sql = "DELETE FROM users";
  return await queryAsync(sql);
};

module.exports = {
  getDashboardStats,
  getLatestWinnersAdmin,
  getAllPeserta,
  deletePesertaById,
  getSemuaHadiah,
  resetAllData,
  getDivisiList,
  getPesertaPaged,
  createPeserta,
  updatePeserta,
  deleteAllPeserta
};