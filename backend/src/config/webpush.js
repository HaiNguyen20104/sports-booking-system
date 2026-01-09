const webpush = require('web-push');

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    `mailto:${process.env.EMAIL_USER || 'admin@sportsbooking.com'}`,
    vapidPublicKey,
    vapidPrivateKey
  );
}

module.exports = webpush;
