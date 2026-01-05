const db = require('../models');
const { generateId } = require('../utils/generateId');
const AppError = require('../utils/AppError');
const { ERROR_CODES, MESSAGES, COURT_DEFAULTS } = require('../constants');

class CourtService {
  async createCourt(createCourtDTO) {
    const { name, location, description, status, slot_duration, ownerId, price_slots } = createCourtDTO;

    // Validate required fields
    if (!name || !location) {
      throw AppError.badRequest(ERROR_CODES.COURT_REQUIRED_FIELDS, MESSAGES.ERROR.COURT_REQUIRED_FIELDS);
    }

    const courtId = generateId('C', 10);

    const transaction = await db.sequelize.transaction();

    try {
      // Create court
      const court = await db.Court.create({
        id: courtId,
        name,
        location,
        description: description || null,
        status: status || COURT_DEFAULTS.STATUS,
        slot_duration: slot_duration || COURT_DEFAULTS.SLOT_DURATION,
        owner_id: ownerId
      }, { transaction });

      // Create price slots if provided
      let createdPriceSlots = [];
      if (price_slots && price_slots.length > 0) {
        const priceSlotsData = price_slots.map(slot => ({
          id: generateId('PS', 10),
          start_time: slot.start_time,
          end_time: slot.end_time,
          price: slot.price,
          tblCourtId: courtId
        }));

        createdPriceSlots = await db.CourtPriceSlot.bulkCreate(priceSlotsData, { transaction });
      }

      await transaction.commit();

      return {
        id: court.id,
        name: court.name,
        location: court.location,
        description: court.description,
        status: court.status,
        slot_duration: court.slot_duration,
        owner_id: court.owner_id,
        price_slots: createdPriceSlots.map(slot => ({
          id: slot.id,
          start_time: slot.start_time,
          end_time: slot.end_time,
          price: slot.price
        }))
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAllCourts() {
    const courts = await db.Court.findAll({
      where: { is_deleted: false },
      include: [
        {
          model: db.User,
          as: 'owner',
          attributes: ['id', 'full_name', 'email', 'phone']
        },
        {
          model: db.CourtPriceSlot,
          as: 'priceSlots',
          attributes: ['id', 'start_time', 'end_time', 'price']
        }
      ]
    });

    return courts;
  }

  async getCourtById(id) {
    const court = await db.Court.findOne({
      where: { id, is_deleted: false },
      include: [
        {
          model: db.User,
          as: 'owner',
          attributes: ['id', 'full_name', 'email', 'phone']
        },
        {
          model: db.CourtPriceSlot,
          as: 'priceSlots',
          attributes: ['id', 'start_time', 'end_time', 'price']
        }
      ]
    });

    if (!court) {
      throw AppError.notFound(ERROR_CODES.COURT_NOT_FOUND, MESSAGES.ERROR.COURT_NOT_FOUND);
    }

    return court;
  }

  async getMyCourts(ownerId) {
    const courts = await db.Court.findAll({
      where: { owner_id: ownerId, is_deleted: false },
      include: [{
        model: db.CourtPriceSlot,
        as: 'priceSlots',
        attributes: ['id', 'start_time', 'end_time', 'price']
      }]
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

    // Extract price_slots from changes (không update trực tiếp vào court table)
    const { price_slots, ...courtChanges } = changes;

    const transaction = await db.sequelize.transaction();

    try {
      // Update court fields (excluding price_slots)
      if (Object.keys(courtChanges).length > 0) {
        await court.update(courtChanges, { transaction });
      }

      // Update price slots if provided
      if (price_slots !== undefined) {
        // Delete existing price slots
        await db.CourtPriceSlot.destroy({
          where: { tblCourtId: courtId },
          transaction
        });

        // Create new price slots
        if (price_slots && price_slots.length > 0) {
          const priceSlotsData = price_slots.map(slot => ({
            id: generateId('PS', 10),
            start_time: slot.start_time,
            end_time: slot.end_time,
            price: slot.price,
            tblCourtId: courtId
          }));

          await db.CourtPriceSlot.bulkCreate(priceSlotsData, { transaction });
        }
      }

      await transaction.commit();

      // Fetch updated court with price slots
      const updatedCourt = await db.Court.findOne({
        where: { id: courtId },
        include: [{
          model: db.CourtPriceSlot,
          as: 'priceSlots',
          attributes: ['id', 'start_time', 'end_time', 'price']
        }]
      });

      return updatedCourt;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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
