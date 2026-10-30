const config = require('./config/env');
const app = require('./app');
const db = require('./config/db');
const logger = require('./utils/logger');

async function start() {
  try {
    await db.query('SELECT 1');
    logger.info('Kết nối PostgreSQL thành công');

    const server = app.listen(config.port, '0.0.0.0', () => {
      logger.info(`Server chạy tại http://localhost:${config.port}`);
    });

    const shutdown = () => {
      logger.info('Đang tắt server...');
      server.close(async () => {
        await db.pool.end();
        process.exit(0);
      });
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    logger.error(`Không thể khởi động: ${err.message}`);
    process.exit(1);
  }
}

start();