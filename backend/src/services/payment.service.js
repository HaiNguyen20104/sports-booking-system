const stripe = require('../config/stripe');
const db = require('../models');
const { generateId } = require('../utils/generateId');
const { ROLES, ERROR_CODES, MESSAGES } = require('../constants');
const notificationService = require('./notification.service');
class PaymentService {
  async createCheckoutSession(createCheckoutDTO) {
    const { booking_id, user_id } = createCheckoutDTO;

    // Find booking
    const booking = await db.Booking.findOne({
      where: {
        id: booking_id,
        tblUserId: user_id,
        parent_booking_id: null,
        is_deleted: false,
        status: 'pending'
      },
      include: [{
        model: db.Court,
        as: 'court',
        attributes: ['id', 'name']
      }]
    });

    if (!booking) {
      const error = new Error(MESSAGES.ERROR.BOOKING_NOT_FOUND);
      error.code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw error;
    }

    // Debug log
    console.log('Booking found:', {
      id: booking.id,
      total_price: booking.total_price,
      court: booking.court
    });

    // Check if transaction already exists
    const existingTransaction = await db.Transaction.findOne({
      where: {
        tblBookingId: booking_id,
        status: { [db.Sequelize.Op.in]: ['pending', 'completed'] }
      }
    });

    if (existingTransaction && existingTransaction.status === 'completed') {
      const error = new Error(MESSAGES.ERROR.BOOKING_ALREADY_PAID);
      error.code = ERROR_CODES.BOOKING_ALREADY_PAID;
      throw error;
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'vnd',
          product_data: {
            name: `Đặt sân: ${booking.court.name}`,
            description: `Ngày: ${booking.start_datetime.toLocaleDateString('vi-VN')} - Giờ: ${booking.start_datetime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
          },
          unit_amount: Number(booking.total_price)
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel?booking_id=${booking_id}`,
      metadata: {
        booking_id: booking_id,
        user_id: user_id
      }
    });

    // Create or update transaction record
    if (existingTransaction) {
      await existingTransaction.update({
        transaction_id: session.id,
        status: 'pending'
      });
    } else {
      await db.Transaction.create({
        id: generateId('TX', 10),
        amount: booking.total_price,
        payment_method: 'card',
        payment_provider: 'stripe',
        transaction_id: session.id,
        status: 'pending',
        tblBookingId: booking_id
      });
    }

    return {
      checkout_url: session.url,
      session_id: session.id
    };
  }

  async handleWebhook(payload, signature) {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      const error = new Error(MESSAGES.ERROR.INVALID_WEBHOOK_SIGNATURE);
      error.code = ERROR_CODES.INVALID_SIGNATURE;
      throw error;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await this._handlePaymentSuccess(session);
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      await this._handlePaymentFailed(session);
    }

    return { received: true };
  }

  async _handlePaymentSuccess(session) {
    const bookingId = session.metadata.booking_id;

    // Update transaction
    await db.Transaction.update(
      { status: 'completed' },
      { where: { transaction_id: session.id } }
    );

    // Update booking status to confirmed
    await db.Booking.update(
      { status: 'confirmed' },
      {
        where: {
          [db.Sequelize.Op.or]: [
            { id: bookingId },
            { parent_booking_id: bookingId }
          ]
        }
      }
    );

    // Notify court owner about payment
    await this._notifyOwnerPaymentSuccess(bookingId, session.amount_total);
  }

  /**
   * Notify court owner when payment is successful
   */
  async _notifyOwnerPaymentSuccess(bookingId, amountTotal) {
    try {
      // Get booking with court and user info
      const booking = await db.Booking.findOne({
        where: { id: bookingId },
        include: [
          {
            model: db.Court,
            as: 'court',
            attributes: ['id', 'name', 'owner_id']
          },
          {
            model: db.User,
            as: 'user',
            attributes: ['id', 'full_name', 'email']
          }
        ]
      });

      if (!booking || !booking.court) {
        console.error('Booking or court not found for notification');
        return;
      }

      const startDate = new Date(booking.start_datetime);
      const dateStr = startDate.toLocaleDateString('vi-VN');
      const timeStr = startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      // VND không có cent, không cần chia cho 100
      const amount = amountTotal.toLocaleString('vi-VN');

      const message = `${booking.user?.full_name || 'Khách hàng'} đã thanh toán ${amount}đ cho đặt sân ${booking.court.name} vào ${dateStr} lúc ${timeStr}`;

      await notificationService.create({
        userId: booking.court.owner_id,
        title: 'Thanh toán thành công',
        message,
        type: 'payment',
        data: { bookingId: booking.id }
      });
    } catch (error) {
      // Log error but don't fail the payment process
      console.error('Failed to send payment notification to owner:', error.message);
    }
  }

  async _handlePaymentFailed(session) {
    await db.Transaction.update(
      { status: 'failed' },
      { where: { transaction_id: session.id } }
    );
  }

  async getPaymentStatus(bookingId, userId) {
    const booking = await db.Booking.findOne({
      where: {
        id: bookingId,
        tblUserId: userId,
        is_deleted: false
      },
      include: [{
        model: db.Transaction,
        as: 'transaction'
      }]
    });

    if (!booking) {
      const error = new Error(MESSAGES.ERROR.BOOKING_NOT_FOUND);
      error.code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw error;
    }

    return {
      booking_id: bookingId,
      booking_status: booking.status,
      payment_status: booking.transaction ? booking.transaction.status : 'unpaid',
      amount: booking.total_price,
      paid_at: booking.transaction?.status === 'completed' ? booking.transaction.created_at : null
    };
  }

  async getPaymentHistory(userId, role) {
    const includeOptions = [{
      model: db.Booking,
      as: 'booking',
      where: { is_deleted: false },
      include: [{
        model: db.Court,
        as: 'court',
        attributes: ['id', 'name']
      }]
    }];

    // If not admin, filter by user
    if (role !== ROLES.ADMIN) {
      includeOptions[0].where.tblUserId = userId;
    }

    const transactions = await db.Transaction.findAll({
      include: includeOptions,
      order: [['created_at', 'DESC']]
    });

    return transactions.map(tx => ({
      id: tx.id,
      amount: tx.amount,
      payment_method: tx.payment_method,
      payment_provider: tx.payment_provider,
      status: tx.status,
      created_at: tx.created_at,
      booking: {
        id: tx.booking.id,
        start_datetime: tx.booking.start_datetime,
        end_datetime: tx.booking.end_datetime,
        court_name: tx.booking.court.name
      }
    }));
  }
}

module.exports = new PaymentService();
