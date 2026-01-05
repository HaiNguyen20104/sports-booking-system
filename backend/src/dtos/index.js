// ============ AUTH DTOs ============
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

// ============ COURT DTOs ============
class CreateCourtDTO {
  constructor({ name, location, description, status, slot_duration, price_slots }, ownerId) {
    this.name = name;
    this.location = location;
    this.description = description || null;
    this.status = status;
    this.slot_duration = slot_duration;
    this.ownerId = ownerId;
    this.price_slots = price_slots || []; // Array of { start_time, end_time, price }
  }
}

class UpdateCourtDTO {
  // Fields mà user thường được phép update
  static ALLOWED_FIELDS = ['name', 'location', 'description', 'status', 'slot_duration', 'price_slots'];
  
  // Fields chỉ admin được update
  static ADMIN_ONLY_FIELDS = ['is_deleted', 'deleted_at', 'owner_id'];

  constructor(body, courtId, currentUser) {
    this.courtId = courtId;
    this.userId = currentUser.id;
    this.userRole = currentUser.role;
    
    // Chỉ lấy các fields được phép
    this.changes = this._extractAllowedFields(body, currentUser.role);
  }

  _extractAllowedFields(body, userRole) {
    const changes = {};
    
    // Lấy các fields thường
    for (const field of UpdateCourtDTO.ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        changes[field] = body[field];
      }
    }
    
    // Admin được phép update thêm các fields nhạy cảm
    if (userRole === 'admin') {
      for (const field of UpdateCourtDTO.ADMIN_ONLY_FIELDS) {
        if (body[field] !== undefined) {
          changes[field] = body[field];
        }
      }
    }
    
    return changes;
  }

  hasChanges() {
    return Object.keys(this.changes).length > 0;
  }
}

class DeleteCourtDTO {
  constructor(courtId, currentUser) {
    this.courtId = courtId;
    this.userId = currentUser.id;
    this.userRole = currentUser.role;
  }
}

// ============ USER CONTEXT DTO ============
class CurrentUserDTO {
  constructor({ id, email, role, full_name }) {
    this.id = id;
    this.email = email;
    this.role = role;
    this.full_name = full_name;
  }
}

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
  
  // Common
  CurrentUserDTO
};
