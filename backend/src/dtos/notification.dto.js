class SaveSubscriptionDTO {
  constructor(userId, deviceId, subscription) {
    this.user_id = userId;
    this.device_id = deviceId;
    this.endpoint = subscription?.endpoint;
    this.p256dh = subscription?.keys?.p256dh;
    this.auth = subscription?.keys?.auth;
  }
}

class RemoveSubscriptionDTO {
  constructor(userId, deviceId) {
    this.user_id = userId;
    this.device_id = deviceId;
  }
}

module.exports = {
  SaveSubscriptionDTO,
  RemoveSubscriptionDTO
};
