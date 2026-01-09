const paymentService = require('../services/payment.service');
const ApiResponse = require('../utils/apiResponse');
const { ERROR_CODES, MESSAGES } = require('../constants');
const { CreateCheckoutDTO } = require('../dtos/payment.dto');

class PaymentController {
  async createCheckoutSession(req, res) {
    try {
      const createCheckoutDTO = new CreateCheckoutDTO(
        req.body.booking_id,
        req.user.id
      );
      const result = await paymentService.createCheckoutSession(createCheckoutDTO);

      return ApiResponse.success(res, result, MESSAGES.SUCCESS.CHECKOUT_CREATED);
    } catch (error) {
      console.error('Create checkout session error:', error);

      if (error.code === ERROR_CODES.BOOKING_NOT_FOUND) {
        return ApiResponse.notFound(res, MESSAGES.ERROR.BOOKING_NOT_FOUND);
      }
      if (error.code === ERROR_CODES.BOOKING_ALREADY_PAID) {
        return ApiResponse.badRequest(res, MESSAGES.ERROR.BOOKING_ALREADY_PAID);
      }

      return ApiResponse.error(res, MESSAGES.ERROR.PAYMENT_CREATE_FAILED);
    }
  }

  async handleWebhook(req, res) {
    try {
      const signature = req.headers['stripe-signature'];
      const result = await paymentService.handleWebhook(req.body, signature);

      return res.json(result);
    } catch (error) {
      console.error('Webhook error:', error);
      return res.status(400).json({ error: error.message });
    }
  }

  async getPaymentStatus(req, res) {
    try {
      const result = await paymentService.getPaymentStatus(
        req.params.bookingId,
        req.user.id
      );

      return ApiResponse.success(res, result, MESSAGES.SUCCESS.PAYMENT_STATUS_FETCHED);
    } catch (error) {
      console.error('Get payment status error:', error);

      if (error.code === ERROR_CODES.BOOKING_NOT_FOUND) {
        return ApiResponse.notFound(res, MESSAGES.ERROR.BOOKING_NOT_FOUND);
      }

      return ApiResponse.error(res, MESSAGES.ERROR.PAYMENT_STATUS_FAILED);
    }
  }
}

module.exports = new PaymentController();
