require('dotenv').config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

// 1. DEKLARASI ENVIRONMENT VARIABLE DULUAN
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();

// 2. MIDDLEWARE UTAMA (WAJIB SEBELUM ROUTES)
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// 3. IMPORT ROUTES
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const spinRoutes = require('./routes/spinRoutes');

// 4. GUNAKAN ROUTES
app.use("/api/admin", authRoutes); 
app.use("/api", userRoutes); 
app.use("/api/admin", adminRoutes); 
app.use('/api/spin', spinRoutes);

// 5. SETUP HTTP & SOCKET.IO SERVER
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
    methods: ["GET", "POST"]
  }
});

app.set('io', io);

// Import Socket Setup Eksternal jika ada
const setupSocket = require("./sockets/spinSocket");
if (typeof setupSocket === 'function') {
  setupSocket(io);
}

// Socket Listener Event Connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// 6. JALANKAN SERVER
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});