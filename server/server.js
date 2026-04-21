const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// ----- Multer Setup -----
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, and WEBP images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Make upload middleware available globally
app.set('upload', upload);

// ----- Middleware -----
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ----- Routes -----
const authRoutes          = require('./routes/authRoutes');
const issueRoutes         = require('./routes/issueRoutes');
const adminRoutes         = require('./routes/adminRoutes');
const blockRoutes         = require('./routes/blockRoutes');
const notificationRoutes  = require('./routes/notificationRoutes');

app.use('/api/auth',           authRoutes);
app.use('/api/issues',         issueRoutes);
app.use('/api/admin',          adminRoutes);
app.use('/api/block',          blockRoutes);
app.use('/api/notifications',  notificationRoutes);

// Base route — health check
app.get('/', (req, res) => {
  res.json({
    message: 'Urban Issue Reporting Platform API Running',
    version: '1.0.0',
    status: 'ok',
    endpoints: ['/api/auth', '/api/issues', '/api/admin', '/api/block', '/api/notifications']
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// ----- Start Server -----
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📡 API Base: http://localhost:${PORT}`);
    console.log(`🗄️  Database: MongoDB Atlas Connected`);
  });
}).catch((err) => {
  console.error('Failed to connect to database:', err.message);
  process.exit(1);
});

