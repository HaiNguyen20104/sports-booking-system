class CreateCourtDTO {
  constructor({ name, location, description, status, slot_duration, price_slots }, ownerId) {
    this.name = name;
    this.location = location;
    this.description = description || null;
    this.status = status;
    this.slot_duration = slot_duration;
    this.ownerId = ownerId;
    this.price_slots = price_slots || [];
  }
}

class UpdateCourtDTO {
  static ALLOWED_FIELDS = ['name', 'location', 'description', 'status', 'slot_duration', 'price_slots'];
  static ADMIN_ONLY_FIELDS = ['is_deleted', 'deleted_at', 'owner_id'];

  constructor(body, courtId, currentUser) {
    this.courtId = courtId;
    this.userId = currentUser.id;
    this.userRole = currentUser.role;
    this.changes = this._extractAllowedFields(body, currentUser.role);
  }

  _extractAllowedFields(body, userRole) {
    const changes = {};
    
    for (const field of UpdateCourtDTO.ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        changes[field] = body[field];
      }
    }
    
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

module.exports = {
  CreateCourtDTO,
  UpdateCourtDTO,
  DeleteCourtDTO
};
