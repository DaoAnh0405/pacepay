const router = require('express').Router();
const db = require('../config/db');

router.get('/', (req, res) => {
  res.render('pages/home', { title: 'Trang chủ' });
});

router.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(500).json({ status: 'db_error' });
  }
});

module.exports = router;