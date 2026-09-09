require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { Server } = require('socket.io');
const { db, queryAsync } = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const verifyAdminToken = require('./middlewares/AuthMiddleware');

const requiredEnv = ['PORT', 'CLIENT_URL', 'JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_NAME'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required env: ${key}`);
  }
}

const PORT = Number(process.env.PORT || 3001);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const app = express();

app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, message: 'Too many requests' },
});

app.use('/api', apiLimiter);

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const spinRoutes = require('./routes/spinRoutes');

app.use('/api/admin/login', apiLimiter);
app.use('/api/admin', authRoutes);
app.use('/api', userRoutes);
app.use('/api/admin', verifyAdminToken, adminRoutes);
app.use('/api/spin', verifyAdminToken, spinRoutes);

app.get('/healthz', async (req, res, next) => {
  try {
    await queryAsync('SELECT 1');
    res.json({ success: true, data: { status: 'ok' } });
  } catch (error) {
    next(error);
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

const setupSocket = require('./sockets/spinSocket');
if (typeof setupSocket === 'function') {
  setupSocket(io);
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: 'Route not found',
  });
});

app.use(errorHandler);

const shutdown = async (signal) => {
  console.log(`${signal}: shutting down`);
  io.close();
  server.close(async () => {
    try {
      await db.end();
    } finally {
      process.exit(0);
    }
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});