INSERT INTO users (full_name, email, password_hash)
VALUES ('Admin', 'admin@example.com', 'THAY_BANG_HASH_BCRYPT')
ON CONFLICT (email) DO NOTHING;