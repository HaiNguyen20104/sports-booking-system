const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

const ALL_TRANSACTION_STATUS = Object.values(TRANSACTION_STATUS);

const PAYMENT_METHOD = {
  STRIPE: 'stripe',
  MOMO: 'momo',
  VNPAY: 'vnpay',
  CASH: 'cash'
};

const ALL_PAYMENT_METHODS = Object.values(PAYMENT_METHOD);

module.exports = {
  TRANSACTION_STATUS,
  ALL_TRANSACTION_STATUS,
  PAYMENT_METHOD,
  ALL_PAYMENT_METHODS
};
