CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (full_name, email, password_hash, role)
VALUES
  ('Đào Văn Anh', 'adminanh@pacepay.test', crypt('Demo@1234', gen_salt('bf', 10)), 'admin'),
  ('Nguyễn Văn An', 'an@pacepay.test',    crypt('Demo@1234', gen_salt('bf', 10)), 'user'),
  ('Trần Thị Bình', 'binh@pacepay.test',  crypt('Demo@1234', gen_salt('bf', 10)), 'user')
ON CONFLICT (email) DO NOTHING;