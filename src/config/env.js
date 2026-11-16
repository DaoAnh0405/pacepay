require('dotenv').config({ quiet: true });
const Joi = require('joi');

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),

  PORT: Joi.number().default(3000),

  // Neon PostgreSQL
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .allow('')
    .default(''),

  DATABASE_URL_DIRECT: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .allow('')
    .default(''),

  // PostgreSQL local
  DB_HOST: Joi.string().allow('').default(''),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().allow('').default(''),
  DB_NAME_TEST: Joi.string().default('pacepay_test'),
  DB_USER: Joi.string().allow('').default(''),
  DB_PASSWORD: Joi.string().allow('').default(''),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  BCRYPT_ROUNDS: Joi.number().integer().min(4).max(15).default(10),

  MAIL_USER: Joi.string().allow('').default(''),
  MAIL_PASS: Joi.string().allow('').default(''),
  MAIL_FROM: Joi.string().allow('').default(''),

  SMS_PROVIDER: Joi.string()
    .valid('mock', 'twilio')
    .default('mock'),
}).unknown(true);

const { value, error } = schema.validate(process.env, {
  abortEarly: false,
});

if (error) {
  throw new Error(`Cấu hình môi trường không hợp lệ: ${error.message}`);
}

const isProd = value.NODE_ENV === 'production';
const isTest = value.NODE_ENV === 'test';

const hasLocalDatabaseConfig = Boolean(
  value.DB_HOST && value.DB_NAME && value.DB_USER
);

if (isProd && !value.DATABASE_URL) {
  throw new Error('Production cần DATABASE_URL (Neon pooled connection)');
}

if (!isProd && !hasLocalDatabaseConfig) {
  throw new Error('Development/test cần cấu hình PostgreSQL local');
}

module.exports = {
  nodeEnv: value.NODE_ENV,
  isProd,
  isTest,
  port: value.PORT,

  db: isProd
    ? {
        connectionString: value.DATABASE_URL,
      }
    : {
        host: value.DB_HOST,
        port: value.DB_PORT,
        user: value.DB_USER,
        password: value.DB_PASSWORD,
        database: isTest
          ? value.DB_NAME_TEST
          : value.DB_NAME,
      },

  dbMigration: {
    connectionString: value.DATABASE_URL_DIRECT,
  },

  jwt: {
    secret: value.JWT_SECRET,
    expiresIn: value.JWT_EXPIRES_IN,
  },

  bcryptRounds: value.BCRYPT_ROUNDS,

  mail: {
    user: value.MAIL_USER,
    pass: value.MAIL_PASS,
    from: value.MAIL_FROM || value.MAIL_USER,
  },

  sms: {
    provider: value.SMS_PROVIDER,
  },
};