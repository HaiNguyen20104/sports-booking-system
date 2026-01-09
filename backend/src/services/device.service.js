const db = require('../models');
const { generateId } = require('../utils/generateId');

class DeviceService {
  /**
   * Tạo hoặc update device khi login
   * @param {object} data - { userId, deviceName, platform, tokenDevice }
   */
  async createOrUpdate(data) {
    let { userId, deviceName, platform, tokenDevice } = data;

    let device = null;

    if (tokenDevice) {
      // Nếu có tokenDevice → tìm device cũ theo tokenDevice + userId
      device = await db.Device.findOne({
        where: {
          token_device: tokenDevice,
          tblUserId: userId
        }
      });
      
      // Debug log
      // console.log('tokenDevice received:', tokenDevice);
      // console.log('userId:', userId);
      // console.log('device found:', device ? device.id : 'null');
    }

    if (device) {
      // Update device hiện có
      await device.update({
        name: deviceName,
        platform,
        last_active: new Date().toISOString()
      });
      // Reload để lấy data mới nhất
      await device.reload();
    } else {
      // Tạo device mới (sinh tokenDevice nếu client không gửi)
      const newTokenDevice = tokenDevice || this.generateTokenDevice();
      device = await db.Device.create({
        id: generateId('DV', 10),
        name: deviceName,
        token_device: newTokenDevice,
        platform,
        last_active: new Date().toISOString(),
        tblUserId: userId
      });
      console.log('Created new device with tokenDevice:', newTokenDevice);
    }

    return {
      id: device.id,
      name: device.name,
      platform: device.platform,
      tokenDevice: device.token_device,
    };
  }

  /**
   * Sinh tokenDevice (UUID)
   */
  generateTokenDevice() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Lấy device by id
   */
  async getById(deviceId, userId) {
    return await db.Device.findOne({
      where: {
        id: deviceId,
        tblUserId: userId
      }
    });
  }
}

module.exports = new DeviceService();
