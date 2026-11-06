exports.create = async (client, userId) => {
  const { rows } = await client.query(
    'INSERT INTO wallets (user_id) VALUES ($1) RETURNING id, balance',
    [userId],
  );
  return rows[0];
};