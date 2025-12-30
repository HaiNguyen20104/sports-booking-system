require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const config = require('./config');
const db = require('./models');

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/css', express.static(path.join(__dirname, '../../frontend/public/css')));
app.use('/js', express.static(path.join(__dirname, '../../frontend/public/js')));
app.use('/images', express.static(path.join(__dirname, '../../frontend/public/images')));

// View engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../../frontend/views'));

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/courts', require('./routes/court.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));

// Web Routes
app.get('/', (req, res) => {
  res.render('pages/index', { 
    title: 'Hệ Thống Đặt Sân Thể Thao',
    message: 'Chào mừng đến với hệ thống đặt sân'
  });
});

// Auth pages
app.get('/register', (req, res) => {
  res.render('pages/register', {
    title: 'Đăng ký tài khoản'
  });
});

app.get('/login', (req, res) => {
  res.render('pages/login', {
    title: 'Đăng nhập'
  });
});

app.get('/verify-email', (req, res) => {
  res.render('pages/verify-email', {
    title: 'Xác thực Email'
  });
});

app.get('/profile', (req, res) => {
  res.render('pages/profile', {
    title: 'Thông tin cá nhân'
  });
});

app.get('/forgot-password', (req, res) => {
  res.render('pages/forgot-password', {
    title: 'Quên mật khẩu'
  });
});

app.get('/reset-password', (req, res) => {
  res.render('pages/reset-password', {
    title: 'Đặt lại mật khẩu'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.env
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(config.env === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${config.env}`);
  console.log(`Visit: http://localhost:${PORT}`);
});

module.exports = app;
