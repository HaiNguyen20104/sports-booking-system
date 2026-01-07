const { RegisterDTO, LoginDTO, VerifyEmailDTO, ForgotPasswordDTO, ResetPasswordDTO } = require('./auth.dto');
const { CreateCourtDTO, UpdateCourtDTO, DeleteCourtDTO } = require('./court.dto');
const { CurrentUserDTO } = require('./user.dto');
const { CreateBookingDTO } = require('./booking.dto');

module.exports = {
  // Auth
  RegisterDTO,
  LoginDTO,
  VerifyEmailDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  
  // Court
  CreateCourtDTO,
  UpdateCourtDTO,
  DeleteCourtDTO,
  
  // User
  CurrentUserDTO,

  // Booking
  CreateBookingDTO
};
