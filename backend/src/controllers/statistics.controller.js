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
}

module.exports = new StatisticsController();
