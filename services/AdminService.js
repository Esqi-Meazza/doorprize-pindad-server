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

const updatePeserta = async (id_user, { nip, nama_lengkap, tgl_lahir, id_divisi, status_terdaftar, status_menang }) => {
  const sql = `
    UPDATE users 
    SET nip = ?, nama_lengkap = ?, tgl_lahir = ?, id_divisi = ?, status_terdaftar = ?, status_menang = ?
    WHERE id_user = ?
  `;

  return await queryAsync(sql, [
    nip,
    nama_lengkap,
    tgl_lahir || null,
    id_divisi,
    status_terdaftar,
    status_menang,
    id_user,
  ]);
};

const deleteAllPeserta = async () => {
  const sql = "DELETE FROM users";
  return await queryAsync(sql);
};

// ==========================================
// FITUR BARU: MANAJEMEN PEMENANG
// ==========================================

const getPemenangPaged = async ({ page = 1, limit = 10, search = '', hadiah = '' }) => {
  const offset = (Number(page) - 1) * Number(limit);
  const params = [];
  let whereClauses = [];

  // Filter Search (NIP / Nama)
  if (search) {
    whereClauses.push("(u.nama_lengkap LIKE ? OR u.nip LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  // Filter Hadiah
  if (hadiah) {
    whereClauses.push("p.id_hadiah = ?");
    params.push(hadiah);
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // Query 1: Total Data
  const countSQL = `
    SELECT COUNT(*) AS total 
    FROM pemenang p 
    JOIN users u ON p.id_user = u.id_user 
    ${whereSQL}
  `;
  const countResult = await queryAsync(countSQL, params);
  const totalItems = countResult[0]?.total || 0;
  const totalPages = Math.ceil(totalItems / Number(limit)) || 1;

  // Query 2: Data Terpotong (Sesuai kolom db pemenang: id_pemenang, id_user, id_hadiah, id_kelompok, mode_undian)
  const dataSQL = `
    SELECT p.id_pemenang, p.mode_undian, p.id_kelompok,
            u.id_user, u.nip, u.nama_lengkap, u.tgl_lahir,
            d.nama_divisi,
            h.id_hadiah, h.nama_hadiah
    FROM pemenang p
    JOIN users u ON p.id_user = u.id_user
    LEFT JOIN divisi d ON u.id_divisi = d.id_divisi
    JOIN hadiah h ON p.id_hadiah = h.id_hadiah
    ${whereSQL}
    ORDER BY p.id_pemenang DESC
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

const diskualifikasiPemenang = async (id_pemenang) => {
  // 1. Dapatkan id_user dan id_hadiah dari tiket kemenangan yang akan dihapus
  const checkSQL = "SELECT id_user, id_hadiah FROM pemenang WHERE id_pemenang = ?";
  const target = await queryAsync(checkSQL, [id_pemenang]);

  if (target.length === 0) {
    throw new Error("Data pemenang tidak ditemukan di database");
  }

  const { id_user, id_hadiah } = target[0];

  // 2. Eksekusi 3 Query Krusial (Hapus Pemenang, Reset Status User, Kembalikan Stok Hadiah)
  await queryAsync("DELETE FROM pemenang WHERE id_pemenang = ?", [id_pemenang]);
  await queryAsync("UPDATE users SET status_menang = 'belum' WHERE id_user = ?", [id_user]);
  await queryAsync("UPDATE hadiah SET stok_sisa = stok_sisa + 1 WHERE id_hadiah = ?", [id_hadiah]);

  return { message: "Pemenang didiskualifikasi. Status peserta di-reset dan stok hadiah dikembalikan!" };
};

// ==========================================
// FITUR: MANAJEMEN HADIAH
// ==========================================

const getSemuaHadiah = async () => {
  const sql = "SELECT id_hadiah, nama_hadiah, tipe, stok_sisa AS stok FROM hadiah ORDER BY tipe ASC, id_hadiah ASC";
  return await queryAsync(sql);
};

const getHadiahPaged = async ({ page = 1, limit = 10, search = '', tipe = '' }) => {
  const offset = (Number(page) - 1) * Number(limit);
  const params = [];
  let whereClauses = [];

  if (search) {
    whereClauses.push("nama_hadiah LIKE ?");
    params.push(`%${search}%`);
  }
  if (tipe) {
    whereClauses.push("tipe = ?");
    params.push(tipe);
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const countSQL = `SELECT COUNT(*) AS total FROM hadiah ${whereSQL}`;
  const countResult = await queryAsync(countSQL, params);
  const totalItems = countResult[0]?.total || 0;
  const totalPages = Math.ceil(totalItems / Number(limit)) || 1;

  const dataSQL = `
    SELECT id_hadiah, id_kelompok, nama_hadiah, tipe, stok_total, stok_sisa 
    FROM hadiah 
    ${whereSQL}
    ORDER BY id_hadiah DESC
    LIMIT ? OFFSET ?
  `;
  const data = await queryAsync(dataSQL, [...params, Number(limit), Number(offset)]);

  return {
    data,
    pagination: { currentPage: Number(page), limit: Number(limit), totalItems, totalPages }
  };
};

const tambahHadiah = async ({ id_kelompok, nama_hadiah, tipe, stok_total }) => {
  // Saat hadiah baru dibuat, stok sisa otomatis sama dengan stok total awal
  const sql = `INSERT INTO hadiah (id_kelompok, nama_hadiah, tipe, stok_total, stok_sisa) VALUES (?, ?, ?, ?, ?)`;
  await queryAsync(sql, [id_kelompok || null, nama_hadiah, tipe, stok_total, stok_total]);
  return { message: "Hadiah berhasil ditambahkan!" };
};

const editHadiah = async (id_hadiah, { id_kelompok, nama_hadiah, tipe, stok_total }) => {
  // 1. Ambil data stok lama
  const cekSql = `SELECT stok_total, stok_sisa FROM hadiah WHERE id_hadiah = ?`;
  const hadiahLama = await queryAsync(cekSql, [id_hadiah]);
  
  if (hadiahLama.length === 0) throw new Error("Hadiah tidak ditemukan di database.");
  
  const { stok_total: old_total, stok_sisa: old_sisa } = hadiahLama[0];
  
  // 2. Kalkulasi jumlah hadiah yang sudah dimenangkan peserta
  const jumlahDimenangkan = old_total - old_sisa;
  
  // 3. Hitung stok sisa yang baru
  const new_stok_sisa = stok_total - jumlahDimenangkan;

  // 4. Validasi: Jangan biarkan admin memasukkan stok total lebih kecil dari yang sudah dibagikan
  if (new_stok_sisa < 0) {
    throw new Error(`Stok total tidak boleh lebih kecil dari jumlah yang sudah dimenangkan (${jumlahDimenangkan} item).`);
  }

  const sql = `UPDATE hadiah SET id_kelompok = ?, nama_hadiah = ?, tipe = ?, stok_total = ?, stok_sisa = ? WHERE id_hadiah = ?`;
  await queryAsync(sql, [id_kelompok || null, nama_hadiah, tipe, stok_total, new_stok_sisa, id_hadiah]);
  return { message: "Data hadiah berhasil diperbarui!" };
};

const hapusHadiah = async (id_hadiah) => {
  // Proteksi Integritas Data
  const cekPemenang = await queryAsync(`SELECT COUNT(*) as terpakai FROM pemenang WHERE id_hadiah = ?`, [id_hadiah]);
  if (cekPemenang[0].terpakai > 0) {
    throw new Error("Gagal menghapus: Sudah ada peserta yang memenangkan hadiah ini. Harap diskualifikasi pemenang terlebih dahulu jika ingin menghapus.");
  }

  await queryAsync(`DELETE FROM hadiah WHERE id_hadiah = ?`, [id_hadiah]);
  return { message: "Hadiah berhasil dihapus!" };
};

module.exports = {
  getDashboardStats,
  getLatestWinnersAdmin,
  getAllPeserta,
  deletePesertaById,
  resetAllData,
  getDivisiList,
  getPesertaPaged,
  createPeserta,
  updatePeserta,
  deleteAllPeserta,
  getPemenangPaged,
  diskualifikasiPemenang,
  getSemuaHadiah,
  getHadiahPaged,
  tambahHadiah,
  editHadiah,
  hapusHadiah
};