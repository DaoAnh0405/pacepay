const config = require('../config/env');
const logger = require('../utils/logger');

const wantsJson = (req) =>
  req.originalUrl.startsWith('/api') || req.accepts(['html', 'json']) === 'json';

exports.notFound = (req, res) => {
  if (wantsJson(req)) {
    return res.status(404).json({ message: 'Không tìm thấy' });
  }
  res.status(404).render('pages/404', { title: 'Không tìm thấy trang' });
};

exports.errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  logger.error(err);

  const message = status >= 500 && config.isProd ? 'Lỗi hệ thống' : err.message;

  if (wantsJson(req)) {
    return res.status(status).json({ message });
  }
  res.status(status).render('pages/error', { title: 'Có lỗi xảy ra', message });
};