require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // Email Configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    from: process.env.EMAIL_FROM || 'admin@sportsbooking.com'
  },
  
  // Frontend URL
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Upload Configuration
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880
};
