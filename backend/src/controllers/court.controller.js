const courtService = require('../services/court.service');
const ApiResponse = require('../utils/apiResponse');
const { ERROR_CODES, MESSAGES } = require('../constants');

class CourtController {
  async createCourt(req, res) {
    try {
      const court = await courtService.createCourt(req.body, req.user.id);

      return ApiResponse.success(
        res,
        {
          court,
          message: 'Thêm sân thành công!'
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
      const court = await courtService.updateCourt(
        req.params.id,
        req.body,
        req.user.id,
        req.user.role
      );

      return ApiResponse.success(
        res,
        { court, message: 'Cập nhật sân thành công!' },
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
      await courtService.deleteCourt(req.params.id, req.user.id, req.user.role);

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
