const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('./logger');

// C1 brevo qua HTTPS API (dùng trên Render, vì Render free chặn cổng SMTP)
const useBrevo = Boolean(config.mail.brevoApiKey && config.mail.user) && !config.isTest;

// C2 gmail SMTP (local khi ko có brevo)
const useSmtp = !useBrevo && Boolean(config.mail.user && config.mail.pass) && !config.isTest;

const enabled = useBrevo || useSmtp;

const transporter = useSmtp
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: config.mail.user, pass: config.mail.pass },
    })
  : null;

async function sendViaBrevo(to, subject, text) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': config.mail.brevoApiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'PacePay', email: config.mail.user },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
    signal: AbortSignal.timeout(10000), // quá 10 giây thì báo lỗi, tránh treo request đăng ký
  });

  if (!res.ok) {
    throw new Error(`Brevo ${res.status}: ${await res.text()}`);
  }
}

exports.enabled = enabled;

exports.send = async (to, subject, text) => {
  if (useBrevo) {
    await sendViaBrevo(to, subject, text);
    return;
  }

  if (useSmtp) {
    await transporter.sendMail({ from: config.mail.from, to, subject, text });
    return;
  }

  logger.info(`[Email giả lập] tới ${to} | ${subject} | ${text}`);
};