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
  constructor({ email, password }) {
    this.email = email;
    this.password = password;
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
