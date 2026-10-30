INSERT INTO wallets (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;