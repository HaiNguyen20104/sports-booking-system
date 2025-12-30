const nodemailer = require('nodemailer');
const config = require('./index');

// Tạo transporter cho email
const transporter = nodemailer.createTransporter({
  service: config.email.service,
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.auth.user,
    pass: config.email.auth.pass
  }
});

// Verify email configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('Email configuration error:', error.message);
  } else {
    console.log('Email server is ready');
  }
});

module.exports = transporter;
