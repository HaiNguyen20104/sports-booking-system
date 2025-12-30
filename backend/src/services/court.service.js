const db = require('../models');
const { generateId } = require('../utils/generateId');

class CourtService {
  async createCourt(courtData, ownerId) {
    const { name, location, description, status, slot_duration } = courtData;

    // Validate required fields
    if (!name || !location) {
      throw new Error('Tên sân và địa điểm là bắt buộc');
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
      throw new Error('Court not found');
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
      throw new Error('Court not found');
    }

    // Check if user is owner or admin (admin can manage all courts)
    if (court.owner_id !== userId && userRole !== 'admin') {
      throw new Error('Permission denied');
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
      throw new Error('Court not found');
    }

    // Check if user is owner or admin (admin can manage all courts)
    if (court.owner_id !== userId && userRole !== 'admin') {
      throw new Error('Permission denied');
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
