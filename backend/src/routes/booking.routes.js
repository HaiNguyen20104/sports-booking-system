const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, (req, res) => {
  res.json({ message: 'Get user bookings' });
});

router.get('/:id', authMiddleware, (req, res) => {
  res.json({ message: 'Get booking detail' });
});

router.post('/', authMiddleware, (req, res) => {
  res.json({ message: 'Create booking' });
});

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
