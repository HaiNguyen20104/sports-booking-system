class RegisterDTO {
  constructor({ full_name, email, phone, password, role }) {
    this.full_name = full_name;
    this.email = email;
    this.phone = phone || null;
    this.password = password;
    this.role = role;
  }
}

class LoginDTO {
  constructor({ email, password, deviceName, platform, tokenDevice }) {
    this.email = email;
    this.password = password;
    this.device_name = deviceName || 'Unknown Device';
    this.platform = platform || 'web';
    this.token_device = tokenDevice || null; // Không tự sinh, để backend xử lý
  }
}

class VerifyEmailDTO {
  constructor({ token }) {
    this.token = token;
  }
}

class ForgotPasswordDTO {
  constructor({ email }) {
    this.email = email;
  }
}

class ResetPasswordDTO {
  constructor({ token, password }) {
    this.token = token;
    this.password = password;
  }
}

module.exports = {
  RegisterDTO,
  LoginDTO,
  VerifyEmailDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO
};
