const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const skip = () => config.isTest;

exports.globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  skip,
});

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skip,
  message: { message: 'Bạn thử quá nhiều lần, vui lòng quay lại sau 15 phút.' },
});

exports.transferLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  skip,
  message: { message: 'Bạn thao tác quá nhanh, vui lòng thử lại sau.' },
});