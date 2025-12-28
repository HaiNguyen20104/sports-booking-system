const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const { 
  registerValidation, 
  loginValidation, 
  verifyEmailValidation 
} = require('../validators/auth.validator');

// Public routes
router.post('/register', registerValidation, validate, authController.register);

router.post('/login', loginValidation, validate, authController.login);

router.post('/verify-email', verifyEmailValidation, validate, authController.verifyEmail);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);

router.post('/forgot-password', (req, res) => {
  res.json({ message: 'Forgot password endpoint' });
});

router.post('/reset-password', (req, res) => {
  res.json({ message: 'Reset password endpoint' });
});

module.exports = router;
