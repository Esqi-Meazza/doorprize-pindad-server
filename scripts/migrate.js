require('dotenv').config();
const { db, queryAsync } = require('../config/db');

const indexes = [
  ['users', 'idx_users_divisi', 'CREATE INDEX idx_users_divisi ON users (id_divisi)'],
  ['users', 'idx_users_eligibility', 'CREATE INDEX idx_users_eligibility ON users (status_terdaftar, status_menang)'],
  ['users', 'idx_users_checkin', 'CREATE INDEX idx_users_checkin ON users (nip, tgl_lahir)'],
  ['hadiah', 'idx_hadiah_kelompok_stok', 'CREATE INDEX idx_hadiah_kelompok_stok ON hadiah (id_kelompok, stok_sisa)'],
  ['pemenang', 'idx_pemenang_hadiah', 'CREATE INDEX idx_pemenang_hadiah ON pemenang (id_hadiah)'],
  ['pemenang', 'idx_pemenang_user', 'CREATE INDEX idx_pemenang_user ON pemenang (id_user)'],
  ['pemenang', 'idx_pemenang_kelompok', 'CREATE INDEX idx_pemenang_kelompok ON pemenang (id_kelompok)'],
  ['kelompok_hadiah', 'idx_kelompok_status_urutan', 'CREATE INDEX idx_kelompok_status_urutan ON kelompok_hadiah (status_sesi, urutan_sesi)'],
];

async function migrate() {
  for (const [tableName, indexName, createSql] of indexes) {
    const existing = await queryAsync(
      `SELECT 1 FROM information_schema.statistics
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
       LIMIT 1`,
      [tableName, indexName],
    );

    if (existing.length > 0) {
      console.log(`skip ${indexName}`);
      continue;
    }

    await queryAsync(createSql);
    console.log(`created ${indexName}`);
  }
}

migrate()
  .then(() => db.end())
  .catch((error) => {
    console.error(`Migration failed: ${error.code || error.message}`);
    db.end(() => process.exit(1));
  });
