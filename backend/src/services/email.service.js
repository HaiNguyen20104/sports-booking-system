const nodemailer = require('nodemailer');
const config = require('../config');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async sendVerificationEmail(to, userName, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"Hệ Thống Đặt Sân" <${process.env.EMAIL_FROM}>`,
      to: to,
      subject: 'Xác thực tài khoản - Hệ Thống Đặt Sân',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .token-box { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 20px 0; word-break: break-all; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Chào mừng đến với Hệ Thống Đặt Sân!</h1>
            </div>
            <div class="content">
              <h2>Xin chào ${userName},</h2>
              <p>Cảm ơn bạn đã đăng ký tài khoản! Vui lòng xác thực email của bạn để hoàn tất đăng ký.</p>
              
              <p><strong>Cách 1: Click vào nút bên dưới</strong></p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Xác thực Email</a>
              </div>
              
              <p><strong>Cách 2: Copy token này và dán vào trang xác thực</strong></p>
              <div class="token-box">
                <code>${verificationToken}</code>
              </div>
              
              <p>Link xác thực có hiệu lực trong 24 giờ.</p>
              <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
              
              <div class="footer">
                <p>&copy; 2025 Hệ Thống Đặt Sân Thể Thao</p>
                <p>Email được gửi tự động, vui lòng không trả lời.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(to, userName, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"Hệ Thống Đặt Sân" <${process.env.EMAIL_FROM}>`,
      to: to,
      subject: 'Đặt lại mật khẩu - Hệ Thống Đặt Sân',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #e74c3c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .token-box { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 20px 0; word-break: break-all; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Đặt lại mật khẩu</h1>
            </div>
            <div class="content">
              <h2>Xin chào ${userName},</h2>
              <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
              
              <p><strong>Cách 1: Click vào nút bên dưới</strong></p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
              </div>
              
              <p><strong>Cách 2: Copy token này và dán vào trang đặt lại mật khẩu</strong></p>
              <div class="token-box">
                <code>${resetToken}</code>
              </div>
              
              <div class="warning">
                <strong>Lưu ý quan trọng:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Link đặt lại mật khẩu có hiệu lực trong <strong>1 giờ</strong></li>
                  <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                  <li>Không chia sẻ link hoặc token này với bất kỳ ai</li>
                </ul>
              </div>
              
              <p>Nếu bạn gặp vấn đề, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi.</p>
              
              <div class="footer">
                <p>&copy; 2025 Hệ Thống Đặt Sân Thể Thao</p>
                <p>Email được gửi tự động, vui lòng không trả lời.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}

module.exports = new EmailService();
