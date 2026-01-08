const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/checkRole.middleware');
const validate = require('../middlewares/validate.middleware');
const { createBookingValidation } = require('../validators/booking.validator');
const bookingController = require('../controllers/booking.controller');
const { COURT_MANAGER_ROLES, ROLES } = require('../constants');

router.get('/', authMiddleware, bookingController.getMyBookings);

router.get('/court-bookings', authMiddleware, checkRole(...COURT_MANAGER_ROLES), bookingController.getCourtBookings);

router.get('/all', authMiddleware, checkRole(ROLES.ADMIN), bookingController.getAllBookings);

router.get('/:id', authMiddleware, bookingController.getBookingById);

router.post('/', authMiddleware, createBookingValidation, validate, bookingController.createBooking);

router.put('/:id', authMiddleware, bookingController.updateBooking);

router.patch('/:id/confirm', authMiddleware, checkRole(...COURT_MANAGER_ROLES), bookingController.confirmBooking);

router.delete('/:id', authMiddleware, bookingController.cancelBooking);

router.get('/:id/payment', authMiddleware, (req, res) => {
  res.json({ message: 'Get payment' });
});

module.exports = router;
