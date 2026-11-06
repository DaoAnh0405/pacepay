const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('./logger');

const enabled = Boolean(config.mail.user && config.mail.pass) && !config.isTest;

const transporter = enabled
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: config.mail.user, pass: config.mail.pass },
    })
  : null;

exports.enabled = enabled;

exports.send = async (to, subject, text) => {
  // giả lập gmail(ghi log)
  if (!transporter) {
    logger.info(`[Email giả lập] tới ${to} | ${subject} | ${text}`);
    return;
  }
  await transporter.sendMail({ from: config.mail.from, to, subject, text });
};