# Struktur Folder Server

```text
server/
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
├── config/
│   └── db.js
├── controllers/
│   ├── adminController.js
│   ├── authController.js
│   ├── spinController.js
│   └── userController.js
├── middlewares/
│   └── authMiddleware.js
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── spinRoutes.js
│   └── userRoutes.js
├── services/
│   ├── adminService.js
│   ├── authService.js
│   ├── spinService.js
│   └── userService.js
├── sockets/
│   └── spinSocket.js
└── node_modules/ (artifact dependency, diabaikan dari dokumentasi utama)
```

## Penjelasan per layer arsitektur

### 1) Layer routing (`routes/`)
- `routes/authRoutes.js` — mendaftarkan endpoint login admin dan memetakan request ke `authController`.
- `routes/userRoutes.js` — endpoint publik untuk divisi, check-in, autofill, dan logout peserta.
- `routes/adminRoutes.js` — endpoint admin yang dilindungi middleware token dan berisi operasi dashboard serta management data.
- `routes/spinRoutes.js` — endpoint untuk sesi undian, start/stop spin, respin, dan status panggung.

### 2) Layer controller (`controllers/`)
- `controllers/authController.js` — menangani request login admin dan mengembalikan token JWT.
- `controllers/userController.js` — menangani request peserta untuk validasi data, check-in, logout, dan daftar aktif.
- `controllers/adminController.js` — menangani query admin terkait statistik, peserta, hadiah, dan reset event.
- `controllers/spinController.js` — menangani state panggung, sesi aktif, dan operasi undian agar tersinkronisasi lewat socket.

### 3) Layer service (`services/`)
- `services/authService.js` — validasi user admin, pengecekan password, dan pembuatan JWT.
- `services/userService.js` — query database untuk divisi, pengecekan NIP/tanggal lahir, peserta aktif, dan logout peserta.
- `services/adminService.js` — logika dashboard, pengambilan data pemenang, daftar peserta, hadiah, dan reset event.
- `services/spinService.js` — logika inti undian seperti weighted random, transaksi MySQL, undo spin, dan pergerakan sesi.

### 4) Layer infrastruktur & keamanan
- `config/db.js` — koneksi pool MySQL dan helper `queryAsync` untuk menjalankan query ke database.
- `middlewares/authMiddleware.js` — middleware autentikasi untuk memverifikasi Bearer token admin sebelum request masuk ke endpoint sensitif.
- `sockets/spinSocket.js` — event listener Socket.IO dasar untuk koneksi client ke realtime panggung.

### 5) Entry point dan konfigurasi
- `server.js` — bootstrap aplikasi Express, setup CORS, attachment route, setup socket server, dan start listener HTTP.
- `package.json` — daftar dependency backend seperti Express, socket.io, MySQL2, bcrypt, JWT, dan dotenv.
- `.gitignore` — aturan file yang tidak perlu masuk ke Git untuk server.

> Struktur ini mengikuti pola yang umum dipakai pada backend Node.js: `routes` menerima request, `controllers` memproses HTTP, `services` menangani bisnis logic, dan `config`/`middlewares` menangani infrastruktur serta keamanan.
