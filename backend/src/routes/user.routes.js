const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/profile', authMiddleware, (req, res) => {
  res.json({ message: 'Get user profile' });
});

router.put('/profile', authMiddleware, (req, res) => {
  res.json({ message: 'Update user profile' });
});

router.put('/change-password', authMiddleware, (req, res) => {
  res.json({ message: 'Change password' });
});

module.exports = router;
