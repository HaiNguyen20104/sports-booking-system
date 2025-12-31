const db = require('../models');
const { generateId } = require('../utils/generateId');
const AppError = require('../utils/AppError');
const { ERROR_CODES, MESSAGES, COURT_DEFAULTS } = require('../constants');

class CourtService {
  async createCourt(createCourtDTO) {
    const { name, location, description, status, slot_duration, ownerId } = createCourtDTO;

    // Validate required fields
    if (!name || !location) {
      throw AppError.badRequest(ERROR_CODES.COURT_REQUIRED_FIELDS, MESSAGES.ERROR.COURT_REQUIRED_FIELDS);
    }

    const courtId = generateId('C', 10);

    // Create court
    const court = await db.Court.create({
      id: courtId,
      name,
      location,
      description: description || null,
      status: status || COURT_DEFAULTS.STATUS,
      slot_duration: slot_duration || COURT_DEFAULTS.SLOT_DURATION,
      owner_id: ownerId
    });

    return {
      id: court.id,
      name: court.name,
      location: court.location,
      description: court.description,
      status: court.status,
      slot_duration: court.slot_duration,
      owner_id: court.owner_id
    };
  }

  async getAllCourts() {
    const courts = await db.Court.findAll({
      where: { is_deleted: false },
      include: [{
        model: db.User,
        as: 'owner',
        attributes: ['id', 'full_name', 'email', 'phone']
      }]
    });

    return courts;
  }

  async getCourtById(id) {
    const court = await db.Court.findOne({
      where: { id, is_deleted: false },
      include: [{
        model: db.User,
        as: 'owner',
        attributes: ['id', 'full_name', 'email', 'phone']
      }]
    });

    if (!court) {
      throw AppError.notFound(ERROR_CODES.COURT_NOT_FOUND, MESSAGES.ERROR.COURT_NOT_FOUND);
    }

    return court;
  }

  async getMyCourts(ownerId) {
    const courts = await db.Court.findAll({
      where: { owner_id: ownerId, is_deleted: false }
    });

    return courts;
  }

  async updateCourt(updateCourtDTO) {
    const { courtId, changes, userId, userRole } = updateCourtDTO;

    // Kiểm tra có gì để update không
    if (!updateCourtDTO.hasChanges()) {
      throw AppError.badRequest(ERROR_CODES.NO_CHANGES, MESSAGES.ERROR.NO_CHANGES);
    }

    const court = await db.Court.findOne({
      where: { id: courtId, is_deleted: false }
    });

    if (!court) {
      throw AppError.notFound(ERROR_CODES.COURT_NOT_FOUND, MESSAGES.ERROR.COURT_NOT_FOUND);
    }

    if (!court.canModify(userId, userRole)) {
      throw AppError.forbidden(ERROR_CODES.PERMISSION_DENIED, MESSAGES.ERROR.PERMISSION_DENIED);
    }

    // Chỉ update các fields có trong changes (đã được filter bởi DTO)
    await court.update(changes);

    return court;
  }

  async deleteCourt(deleteCourtDTO) {
    const { courtId, userId, userRole } = deleteCourtDTO;

    const court = await db.Court.findOne({
      where: { id: courtId, is_deleted: false }
    });

    if (!court) {
      throw AppError.notFound(ERROR_CODES.COURT_NOT_FOUND, MESSAGES.ERROR.COURT_NOT_FOUND);
    }

    if (!court.canModify(userId, userRole)) {
      throw AppError.forbidden(ERROR_CODES.PERMISSION_DENIED, MESSAGES.ERROR.PERMISSION_DENIED);
    }

    // Soft delete
    await court.update({
      is_deleted: true,
      deleted_at: new Date()
    });

    return true;
  }
}

module.exports = new CourtService();
