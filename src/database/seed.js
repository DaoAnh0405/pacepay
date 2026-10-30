const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const dir = path.join(__dirname, 'seeders');

async function seed() {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    await pool.query(fs.readFileSync(path.join(dir, file), 'utf8'));
    console.log(`Đã seed: ${file}`);
  }
}

seed()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());