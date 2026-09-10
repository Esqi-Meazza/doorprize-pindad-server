--
-- Table structure for table admin
--

CREATE TABLE `admin` (
  id_admin int NOT NULL,
  username varchar(50) NOT NULL,
  password varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table divisi
--

CREATE TABLE divisi (
  id_divisi int NOT NULL,
  nama_divisi varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table hadiah
--

CREATE TABLE hadiah (
  id_hadiah int NOT NULL,
  id_kelompok int DEFAULT NULL,
  nama_hadiah varchar(150) NOT NULL,
  tipe enum('super','grand','reguler') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  stok_total int DEFAULT '1',
  stok_sisa int DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table kelompok_hadiah
--

CREATE TABLE kelompok_hadiah (
  id_kelompok int NOT NULL,
  nama_kelompok varchar(100) NOT NULL,
  tipe_event enum('super','grand','multi','batch') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  urutan_sesi int NOT NULL,
  target_jumlah_pemenang int NOT NULL DEFAULT '9',
  status_sesi enum('pending','active','complate') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table pemenang
--

CREATE TABLE pemenang (
  id_pemenang int NOT NULL,
  id_user int DEFAULT NULL,
  id_hadiah int NOT NULL,
  id_kelompok int DEFAULT NULL,
  mode_undian enum('super','grand','multi','batch') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table users
--

CREATE TABLE users (
  id_user int NOT NULL,
  nip varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  tgl_lahir date NOT NULL,
  id_divisi int NOT NULL,
  nama_lengkap varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  status_terdaftar enum('belum','sudah') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'belum',
  status_menang enum('belum','sudah') DEFAULT 'belum'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table admin
--
ALTER TABLE admin
  ADD PRIMARY KEY (id_admin);

--
-- Indexes for table divisi
--
ALTER TABLE divisi
  ADD PRIMARY KEY (id_divisi);

--
-- Indexes for table hadiah
--
ALTER TABLE hadiah
  ADD PRIMARY KEY (id_hadiah),
  ADD KEY id_kelompok (id_kelompok),
  ADD KEY stok_sisa (stok_sisa),
  ADD KEY idx_hadiah_kelompok_stok (id_kelompok,stok_sisa);

--
-- Indexes for table kelompok_hadiah
--
ALTER TABLE kelompok_hadiah
  ADD PRIMARY KEY (id_kelompok),
  ADD UNIQUE KEY urutan_sesi (urutan_sesi,status_sesi),
  ADD KEY urutan_sesi_2 (urutan_sesi,status_sesi),
  ADD KEY idx_kelompok_status_urutan (status_sesi,urutan_sesi);

--
-- Indexes for table pemenang
--
ALTER TABLE pemenang
  ADD PRIMARY KEY (id_pemenang),
  ADD KEY id_kelompok (id_kelompok),
  ADD KEY id_user (id_user),
  ADD KEY id_hadiah (id_hadiah,id_kelompok);

--
-- Indexes for table users
--
ALTER TABLE users
  ADD PRIMARY KEY (id_user),
  ADD UNIQUE KEY nip (nip),
  ADD KEY id_divisi_2 (id_divisi),
  ADD KEY status_menang (status_menang),
  ADD KEY idx_nip_tgllahir (nip,tgl_lahir),
  ADD KEY idx_status_menang (status_menang),
  ADD KEY nip_2 (nip),
  ADD KEY status_terdaftar (status_terdaftar),
  ADD KEY idx_users_eligibility (status_terdaftar,status_menang);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table admin
--
ALTER TABLE admin
  MODIFY id_admin int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table divisi
--
ALTER TABLE divisi
  MODIFY id_divisi int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table hadiah
--
ALTER TABLE hadiah
  MODIFY id_hadiah int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table kelompok_hadiah
--
ALTER TABLE kelompok_hadiah
  MODIFY id_kelompok int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table pemenang
--
ALTER TABLE pemenang
  MODIFY id_pemenang int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table users
--
ALTER TABLE users
  MODIFY id_user int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table hadiah
--
ALTER TABLE hadiah
  ADD CONSTRAINT hadiah_ibfk_1 FOREIGN KEY (id_kelompok) REFERENCES kelompok_hadiah (id_kelompok) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table pemenang
--
ALTER TABLE pemenang
  ADD CONSTRAINT pemenang_ibfk_1 FOREIGN KEY (id_user) REFERENCES users (id_user) ON DELETE SET NULL,
  ADD CONSTRAINT pemenang_ibfk_2 FOREIGN KEY (id_hadiah) REFERENCES hadiah (id_hadiah) ON DELETE CASCADE,
  ADD CONSTRAINT pemenang_ibfk_3 FOREIGN KEY (id_kelompok) REFERENCES kelompok_hadiah (id_kelompok) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table users
--
ALTER TABLE users
  ADD CONSTRAINT users_ibfk_1 FOREIGN KEY (id_divisi) REFERENCES divisi (id_divisi) ON DELETE RESTRICT ON UPDATE RESTRICT;
COMMIT;
