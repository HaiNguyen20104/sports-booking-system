const courtService = require('../services/court.service');
const ApiResponse = require('../utils/apiResponse');

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
      if (error.message === 'Tên sân và địa điểm là bắt buộc') {
        return ApiResponse.badRequest(res, error.message);
      }
      return ApiResponse.error(res, 'Không thể tạo sân. Vui lòng thử lại.');
    }
  }

  async getAllCourts(req, res) {
    try {
      const courts = await courtService.getAllCourts();
      return ApiResponse.success(res, courts, 'Lấy danh sách sân thành công');
    } catch (error) {
      console.error('Get all courts error:', error);
      return ApiResponse.error(res, 'Không thể lấy danh sách sân');
    }
  }

  async getCourtById(req, res) {
    try {
      const court = await courtService.getCourtById(req.params.id);
      return ApiResponse.success(res, court, 'Lấy thông tin sân thành công');
    } catch (error) {
      console.error('Get court by id error:', error);
      if (error.message === 'Court not found') {
        return ApiResponse.notFound(res, 'Không tìm thấy sân');
      }
      return ApiResponse.error(res, 'Không thể lấy thông tin sân');
    }
  }

  async getMyCourts(req, res) {
    try {
      const courts = await courtService.getMyCourts(req.user.id);
      return ApiResponse.success(res, courts, 'Lấy danh sách sân của bạn thành công');
    } catch (error) {
      console.error('Get my courts error:', error);
      return ApiResponse.error(res, 'Không thể lấy danh sách sân của bạn');
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
      if (error.message === 'Court not found') {
        return ApiResponse.notFound(res, 'Không tìm thấy sân');
      }
      if (error.message === 'Permission denied') {
        return ApiResponse.forbidden(res, 'Bạn không có quyền chỉnh sửa sân này');
      }
      return ApiResponse.error(res, 'Không thể cập nhật sân');
    }
  }

  async deleteCourt(req, res) {
    try {
      await courtService.deleteCourt(req.params.id, req.user.id, req.user.role);

      return ApiResponse.success(
        res,
        { message: 'Xóa sân thành công!' },
        'Court deleted successfully'
      );
    } catch (error) {
      console.error('Delete court error:', error);
      if (error.message === 'Court not found') {
        return ApiResponse.notFound(res, 'Không tìm thấy sân');
      }
      if (error.message === 'Permission denied') {
        return ApiResponse.forbidden(res, 'Bạn không có quyền xóa sân này');
      }
      return ApiResponse.error(res, 'Không thể xóa sân');
    }
  }
}

module.exports = new CourtController();
