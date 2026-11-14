const db = require('../config/db');

// runner = db (mặc định) hoặc client đang trong transaction
exports.findByIdempotency = async (userId, key, runner = db) => {
  const { rows } = await runner.query(
    'SELECT * FROM transactions WHERE user_id = $1 AND idempotency_key = $2',
    [userId, key],
  );
  return rows[0] || null;
};

exports.insert = async (client, t) => {
  const { rows } = await client.query(
    `INSERT INTO transactions
       (reference_code, type, amount, from_wallet_id, to_wallet_id,
        from_balance_after, to_balance_after, note, user_id, idempotency_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [t.referenceCode, t.type, t.amount, t.fromWalletId, t.toWalletId,
      t.fromBalanceAfter, t.toBalanceAfter, t.note, t.userId, t.idempotencyKey],
  );
  return rows[0];
};

// ghép điều kiện lọc, chỉ số thứ tự ($2, $3...) được ghép vào chuỗi,
// còn giá trị người dùng luôn nằm trong mảng params (chống SQL Injection)
function buildWhere(walletId, { type, from, to }) {
  const params = [walletId];
  const conds = ['(t.from_wallet_id = $1 OR t.to_wallet_id = $1)'];
  if (type) {
    params.push(type);
    conds.push(`t.type = $${params.length}`);
  }
  if (from) {
    params.push(from);
    conds.push(`t.created_at >= $${params.length}::date`);
  }
  if (to) {
    params.push(to);
    conds.push(`t.created_at < ($${params.length}::date + 1)`);
  }
  return { where: conds.join(' AND '), params };
}

exports.listForWallet = async (walletId, filters, limit, offset) => {
  const { where, params } = buildWhere(walletId, filters);
  params.push(limit, offset);
  const { rows } = await db.query(
    `SELECT t.reference_code, t.type, t.status, t.amount, t.note, t.created_at,
            CASE WHEN t.from_wallet_id = $1 THEN 'out' ELSE 'in' END AS direction,
            CASE WHEN t.from_wallet_id = $1 THEN t.from_balance_after
                 ELSE t.to_balance_after END AS balance_after,
            fu.full_name AS from_name, tu.full_name AS to_name
     FROM transactions t
     LEFT JOIN wallets fw ON fw.id = t.from_wallet_id
     LEFT JOIN users   fu ON fu.id = fw.user_id
     LEFT JOIN wallets tw ON tw.id = t.to_wallet_id
     LEFT JOIN users   tu ON tu.id = tw.user_id
     WHERE ${where}
     ORDER BY t.created_at DESC, t.id DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return rows;
};

exports.countForWallet = async (walletId, filters) => {
  const { where, params } = buildWhere(walletId, filters);
  const { rows } = await db.query(
    `SELECT COUNT(*) AS total FROM transactions t WHERE ${where}`,
    params,
  );
  return Number(rows[0].total);
};