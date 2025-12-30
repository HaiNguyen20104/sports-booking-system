const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const { 
  registerValidation, 
  loginValidation, 
  verifyEmailValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} = require('../validators/auth.validator');

// Public routes
router.post('/register', registerValidation, validate, authController.register);

router.post('/login', loginValidation, validate, authController.login);

router.post('/verify-email', verifyEmailValidation, validate, authController.verifyEmail);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);

// Password reset routes
router.post('/forgot-password', forgotPasswordValidation, validate, authController.forgotPassword);

router.post('/reset-password', resetPasswordValidation, validate, authController.resetPassword);

module.exports = router;
