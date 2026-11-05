require('dotenv').config({ quiet: true });
const Joi = require('joi');

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().required(),
  DB_NAME_TEST: Joi.string().default('pacepay_test'),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').default(''),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  BCRYPT_ROUNDS: Joi.number().integer().min(4).max(15).default(10),

  MAIL_USER: Joi.string().allow('').default(''),
  MAIL_PASS: Joi.string().allow('').default(''),
  MAIL_FROM: Joi.string().allow('').default(''),
  SMS_PROVIDER: Joi.string().valid('mock', 'twilio').default('mock'),
}).unknown(true);

const { value, error } = schema.validate(process.env, { abortEarly: false });

if (error) {
  throw new Error(`Cấu hình .env không hợp lệ: ${error.message}`);
}

module.exports = {
  nodeEnv: value.NODE_ENV,
  isProd: value.NODE_ENV === 'production',
  isTest: value.NODE_ENV === 'test',
  port: value.PORT,
  db: {
    host: value.DB_HOST,
    port: value.DB_PORT,
    user: value.DB_USER,
    password: value.DB_PASSWORD,
    database: value.NODE_ENV === 'test' ? value.DB_NAME_TEST : value.DB_NAME,
  },
  jwt: {
    secret: value.JWT_SECRET,
    expiresIn: value.JWT_EXPIRES_IN,
  },
  bcryptRounds: value.BCRYPT_ROUNDS,
  mail: { user: value.MAIL_USER, pass: value.MAIL_PASS, from: value.MAIL_FROM || value.MAIL_USER },
  sms: { provider: value.SMS_PROVIDER },
};