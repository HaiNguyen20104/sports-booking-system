const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { createBookingValidation } = require('../validators/booking.validator');
const bookingController = require('../controllers/booking.controller');

router.get('/', authMiddleware, (req, res) => {
  res.json({ message: 'Get user bookings' });
});

router.get('/:id', authMiddleware, (req, res) => {
  res.json({ message: 'Get booking detail' });
});

router.post('/', authMiddleware, createBookingValidation, validate, bookingController.createBooking);

router.put('/:id', authMiddleware, (req, res) => {
  res.json({ message: 'Update booking' });
});

router.delete('/:id', authMiddleware, (req, res) => {
  res.json({ message: 'Cancel booking' });
});

router.get('/:id/payment', authMiddleware, (req, res) => {
  res.json({ message: 'Get payment' });
});

module.exports = router;
