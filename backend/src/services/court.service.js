const db = require('../models');
const { generateId } = require('../utils/generateId');
const AppError = require('../utils/AppError');
const { ERROR_CODES, MESSAGES } = require('../constants');

class CourtService {
  async createCourt(courtData, ownerId) {
    const { name, location, description, status, slot_duration } = courtData;

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
      status: status || 'active',
      slot_duration: slot_duration || 60,
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

  async updateCourt(id, updateData, userId, userRole) {
    const { name, location, description, status, slot_duration } = updateData;

    const court = await db.Court.findOne({
      where: { id, is_deleted: false }
    });

    if (!court) {
      throw AppError.notFound(ERROR_CODES.COURT_NOT_FOUND, MESSAGES.ERROR.COURT_NOT_FOUND);
    }

    // Check if user is owner or admin
    if (court.owner_id !== userId && userRole !== 'admin' && userRole !== 'manager') {
      throw AppError.forbidden(ERROR_CODES.PERMISSION_DENIED, MESSAGES.ERROR.PERMISSION_DENIED);
    }

    // Update court
    await court.update({
      name: name || court.name,
      location: location || court.location,
      description: description !== undefined ? description : court.description,
      status: status || court.status,
      slot_duration: slot_duration || court.slot_duration
    });

    return court;
  }

  async deleteCourt(id, userId, userRole) {
    const court = await db.Court.findOne({
      where: { id, is_deleted: false }
    });

    if (!court) {
      throw AppError.notFound(ERROR_CODES.COURT_NOT_FOUND, MESSAGES.ERROR.COURT_NOT_FOUND);
    }

    // Check if user is owner or admin
    if (court.owner_id !== userId && userRole !== 'admin' && userRole !== 'manager') {
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
