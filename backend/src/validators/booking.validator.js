const { body } = require('express-validator');

const createBookingValidation = [
  body('court_id')
    .notEmpty()
    .withMessage('Court ID is required')
    .isString()
    .withMessage('Court ID must be a string'),

  body('start_datetime')
    .notEmpty()
    .withMessage('Start datetime is required')
    .isISO8601()
    .withMessage('Start datetime must be a valid ISO 8601 date'),

  body('booking_type')
    .optional()
    .isIn(['single', 'recurring'])
    .withMessage('Booking type must be single or recurring'),

  body('note')
    .optional()
    .isString()
    .withMessage('Note must be a string')
    .isLength({ max: 500 })
    .withMessage('Note must not exceed 500 characters')
];

module.exports = {
  createBookingValidation
};
