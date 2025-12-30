const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/checkRole.middleware');

router.get('/', (req, res) => {
  res.json({ message: 'Get all courts' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Get court detail' });
});

router.post('/', authMiddleware, checkRole('owner', 'admin'), (req, res) => {
  res.json({ message: 'Create court' });
});

router.put('/:id', authMiddleware, checkRole('owner', 'admin'), (req, res) => {
  res.json({ message: 'Update court' });
});

router.delete('/:id', authMiddleware, checkRole('owner', 'admin'), (req, res) => {
  res.json({ message: 'Delete court' });
});

module.exports = router;
