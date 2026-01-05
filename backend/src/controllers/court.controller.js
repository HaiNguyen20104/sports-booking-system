const courtService = require('../services/court.service');
const ApiResponse = require('../utils/apiResponse');
const { ERROR_CODES, MESSAGES } = require('../constants');
const { CreateCourtDTO, UpdateCourtDTO, DeleteCourtDTO } = require('../dtos');

class CourtController {
  async createCourt(req, res) {
    try {
      const createCourtDTO = new CreateCourtDTO(req.body, req.user.id);
      const court = await courtService.createCourt(createCourtDTO);

      return ApiResponse.success(
        res,
        {
          court,
          message: MESSAGES.SUCCESS.COURT_CREATED
        },
        'Court created successfully',
        201
      );
    } catch (error) {
      console.error('Create court error:', error);
      if (error.code === ERROR_CODES.COURT_REQUIRED_FIELDS) {
        return ApiResponse.badRequest(res, MESSAGES.ERROR.COURT_REQUIRED_FIELDS);
      }
      return ApiResponse.error(res, MESSAGES.ERROR.COURT_CREATE_FAILED);
    }
  }

  async getAllCourts(req, res) {
    try {
      const courts = await courtService.getAllCourts();
      return ApiResponse.success(res, courts, MESSAGES.SUCCESS.COURT_LIST_FETCHED);
    } catch (error) {
      console.error('Get all courts error:', error);
      return ApiResponse.error(res, MESSAGES.ERROR.COURT_LIST_FAILED);
    }
  }

  async getCourtById(req, res) {
    try {
      const court = await courtService.getCourtById(req.params.id);
      return ApiResponse.success(res, court, MESSAGES.SUCCESS.COURT_FETCHED);
    } catch (error) {
      console.error('Get court by id error:', error);
      if (error.code === ERROR_CODES.COURT_NOT_FOUND) {
        return ApiResponse.notFound(res, MESSAGES.ERROR.COURT_NOT_FOUND);
      }
      return ApiResponse.error(res, MESSAGES.ERROR.COURT_LIST_FAILED);
    }
  }

  async getMyCourts(req, res) {
    try {
      const courts = await courtService.getMyCourts(req.user.id);
      return ApiResponse.success(res, courts, MESSAGES.SUCCESS.MY_COURTS_FETCHED);
    } catch (error) {
      console.error('Get my courts error:', error);
      return ApiResponse.error(res, MESSAGES.ERROR.COURT_LIST_FAILED);
    }
  }

  async updateCourt(req, res) {
    try {
      const updateCourtDTO = new UpdateCourtDTO(req.body, req.params.id, req.user);
      const court = await courtService.updateCourt(updateCourtDTO);

      return ApiResponse.success(
        res,
        { court, message: MESSAGES.SUCCESS.COURT_UPDATED },
        'Court updated successfully'
      );
    } catch (error) {
      console.error('Update court error:', error);
      if (error.code === ERROR_CODES.COURT_NOT_FOUND) {
        return ApiResponse.notFound(res, MESSAGES.ERROR.COURT_NOT_FOUND);
      }
      if (error.code === ERROR_CODES.PERMISSION_DENIED) {
        return ApiResponse.forbidden(res, MESSAGES.ERROR.COURT_PERMISSION_DENIED);
      }
      return ApiResponse.error(res, MESSAGES.ERROR.COURT_UPDATE_FAILED);
    }
  }

  async deleteCourt(req, res) {
    try {
      const deleteCourtDTO = new DeleteCourtDTO(req.params.id, req.user);
      await courtService.deleteCourt(deleteCourtDTO);

      return ApiResponse.success(
        res,
        { message: MESSAGES.SUCCESS.COURT_DELETED },
        'Court deleted successfully'
      );
    } catch (error) {
      console.error('Delete court error:', error);
      if (error.code === ERROR_CODES.COURT_NOT_FOUND) {
        return ApiResponse.notFound(res, MESSAGES.ERROR.COURT_NOT_FOUND);
      }
      if (error.code === ERROR_CODES.PERMISSION_DENIED) {
        return ApiResponse.forbidden(res, MESSAGES.ERROR.COURT_PERMISSION_DENIED);
      }
      return ApiResponse.error(res, MESSAGES.ERROR.COURT_DELETE_FAILED);
    }
  }
}

module.exports = new CourtController();
