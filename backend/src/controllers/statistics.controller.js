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
}

module.exports = new StatisticsController();
