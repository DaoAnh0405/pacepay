const config = require('../config/env');
const logger = require('./logger');

const isMock = config.sms.provider === 'mock';
exports.isMock = isMock;

exports.send = async (phone, message) => {
  if (isMock) {
    logger.info(`[SMS giả lập] tới ${phone}: ${message}`);
    return;
  }
  // SMS thật: gọi nhà cung cấp ở đây, hiện tại dùng giả lập
  throw new Error('Chưa cấu hình nhà cung cấp SMS');
};