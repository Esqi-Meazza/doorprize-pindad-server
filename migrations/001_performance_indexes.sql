-- Apply once to the production database. These indexes match the current
-- lowercase status values used by the application and service queries.

CREATE INDEX idx_users_divisi ON users (id_divisi);
CREATE INDEX idx_users_eligibility ON users (status_terdaftar, status_menang);
CREATE INDEX idx_users_checkin ON users (nip, tgl_lahir);

CREATE INDEX idx_hadiah_kelompok_stok ON hadiah (id_kelompok, stok_sisa);

CREATE INDEX idx_pemenang_hadiah ON pemenang (id_hadiah);
CREATE INDEX idx_pemenang_user ON pemenang (id_user);
CREATE INDEX idx_pemenang_kelompok ON pemenang (id_kelompok);

CREATE INDEX idx_kelompok_status_urutan ON kelompok_hadiah (status_sesi, urutan_sesi);