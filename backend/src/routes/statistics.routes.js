const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statistics.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/checkRole.middleware');
const { ROLES } = require('../constants');

// Admin only: Thống kê tổng quan hệ thống
router.get('/overview', authMiddleware, checkRole(ROLES.ADMIN), statisticsController.getOverview);

module.exports = router;
