CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users
  (full_name, email, phone, password_hash, phone_verified_at, date_of_birth, address, role)
VALUES
  ('Đào Văn Anh', 'adminanh@pacepay.test', '0901000001',
   crypt('Demo@1234', gen_salt('bf', 10)), NOW(), '1999-05-04', 'Hưng Yên', 'admin'),
  ('Nguyễn Văn An', 'an@pacepay.test', '0901000002',
   crypt('Demo@1234', gen_salt('bf', 10)), NOW(), '2000-01-15', 'Hà Nội', 'user'),
  ('Trần Thị Bình', 'binh@pacepay.test', '0901000003',
   crypt('Demo@1234', gen_salt('bf', 10)), NOW(), '2001-08-20', 'Thanh Hóa', 'user')
ON CONFLICT (email) DO NOTHING;