const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, (req, res) => {
  res.json({ message: 'Get user notifications' });
});

router.put('/:id/read', authMiddleware, (req, res) => {
  res.json({ message: 'Mark notification as read' });
});

router.delete('/:id', authMiddleware, (req, res) => {
  res.json({ message: 'Delete notification' });
});

module.exports = router;
