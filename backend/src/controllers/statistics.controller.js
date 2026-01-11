const statisticsService = require('../services/statistics.service');
const ApiResponse = require('../utils/apiResponse');
const { MESSAGES } = require('../constants');

class StatisticsController {
  // GET /api/statistics/overview (Admin)
  async getOverview(req, res) {
    try {
      const { from, to } = req.query;

      const overview = await statisticsService.getOverview({ from, to });

      return ApiResponse.success(
        res,
        overview,
        MESSAGES.SUCCESS.STATISTICS_OVERVIEW_FETCHED
      );
    } catch (error) {
      console.error('Get overview error:', error);
      return ApiResponse.error(
        res,
        MESSAGES.ERROR.STATISTICS_OVERVIEW_FAILED
      );
    }
  }

  // GET /api/statistics/my-courts (Court Owner)
  async getMyCourtsStatistics(req, res) {
    try {
      const { from, to } = req.query;
      const ownerId = req.user.id;

      const statistics = await statisticsService.getMyCourtsStatistics(ownerId, { from, to });

      return ApiResponse.success(
        res,
        statistics,
        MESSAGES.SUCCESS.STATISTICS_MY_COURTS_FETCHED
      );
    } catch (error) {
      console.error('Get my courts statistics error:', error);
      return ApiResponse.error(
        res,
        MESSAGES.ERROR.STATISTICS_MY_COURTS_FAILED
      );
    }
  }

  // GET /api/statistics/courts/:courtId (Court Owner, Admin)
  async getCourtStatistics(req, res) {
    try {
      const { courtId } = req.params;
      const { from, to } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;

      const statistics = await statisticsService.getCourtStatistics(courtId, userId, userRole, { from, to });

      return ApiResponse.success(
        res,
        statistics,
        MESSAGES.SUCCESS.STATISTICS_COURT_DETAIL_FETCHED
      );
    } catch (error) {
      console.error('Get court statistics error:', error);
      if (error.statusCode) {
        return ApiResponse.error(res, error.message, error.statusCode, error.code);
      }
      return ApiResponse.error(
        res,
        MESSAGES.ERROR.STATISTICS_COURT_DETAIL_FAILED
      );
    }
  }
}

module.exports = new StatisticsController();
