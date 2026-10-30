const winston = require('winston');
const config = require('../config/env');

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) => `${timestamp} ${level}: ${stack || message}`),
);

const transports = [new winston.transports.Console({ format: consoleFormat })];

if (!config.isTest) {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  );
}

const logger = winston.createLogger({
  level: config.isProd ? 'info' : 'debug',
  silent: config.isTest,
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports,
});

module.exports = logger;