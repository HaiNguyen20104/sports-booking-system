const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/checkRole.middleware');
const courtController = require('../controllers/court.controller');
const { COURT_MANAGER_ROLES } = require('../constants');

// Protected routes - my-courts must be BEFORE /:id to avoid conflict (Do /:id là dynamic route nên nó sẽ match với bất kỳ path nào)
router.get('/my-courts', authMiddleware, checkRole(...COURT_MANAGER_ROLES), courtController.getMyCourts);

// Public routes
router.get('/', courtController.getAllCourts);

router.get('/:id', courtController.getCourtById);

// Protected routes - only manager and admin can manage courts
router.post('/', authMiddleware, checkRole(...COURT_MANAGER_ROLES), courtController.createCourt);

router.put('/:id', authMiddleware, checkRole(...COURT_MANAGER_ROLES), courtController.updateCourt);

router.delete('/:id', authMiddleware, checkRole(...COURT_MANAGER_ROLES), courtController.deleteCourt);

module.exports = router;
