const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const config = require('../config/env');
const { pool: localPool } = require('../config/db');

const dir = path.join(__dirname, 'migrations');

async function migrate() {
  let migrationPool = localPool;

  if (config.isProd) {
    if (!config.dbMigration.connectionString) {
      throw new Error('Thiếu DATABASE_URL_DIRECT để chạy migration');
    }

    migrationPool = new Pool({
      connectionString: config.dbMigration.connectionString,
      max: 1,
      connectionTimeoutMillis: 10000,
    });

    await localPool.end();
  }

  try {
    await migrationPool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { rows } = await migrationPool.query(
      'SELECT name FROM schema_migrations'
    );

    const done = new Set(rows.map((r) => r.name));

    const files = fs.readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (done.has(file)) {
        console.log(`Đã tồn tại: ${file}`);
        continue;
      }

      const sql = fs.readFileSync(
        path.join(dir, file),
        'utf8'
      );

      const client = await migrationPool.connect();

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');

        console.log(`Đã chạy: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} lỗi: ${err.message}`);
      } finally {
        client.release();
      }
    }

    console.log('Migration hoàn tất.');
  } finally {
    await migrationPool.end();
  }
}

migrate().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});