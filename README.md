# PacePay

Ví điện tử mini: nạp, rút, chuyển tiền và xem lịch sử giao dịch. Dự án học tập, tập trung vào **tính đúng đắn của tiền** và **bảo mật cơ bản**.

**Demo:** https://pacepay.onrender.com

## Tài khoản demo

Mật khẩu chung: `Demo@1234`

| Email | Vai trò |
|---|---|
| `an@pacepay.test` | người dùng |
| `binh@pacepay.test` | người dùng |

Thử đăng nhập `an@pacepay.test`, chuyển tiền cho `binh@pacepay.test` rồi xem lịch sử. Khi đăng ký tài khoản mới, OTP email gửi thật, còn **OTP SMS hiện trên màn hình** vì SMS đang giả lập.

## Tính năng

- Đăng ký 7 bước, đăng nhập (JWT trong cookie `httpOnly`), quên mật khẩu, đổi mật khẩu, đặt PIN 6 số.
- Nạp (giả lập), rút, chuyển tiền theo email. Hạn mức 10.000 đến 50.000.000 ₫; từ 5.000.000 ₫ cần thêm OTP sms.
- Rút và chuyển cần PIN; sai 5 lần khóa 15 phút.
- Lịch sử giao dịch có lọc theo loại, ngày và phân trang.

## Điểm kỹ thuật chính

| Vấn đề | Cách giải quyết |
|---|---|
| Hai giao dịch cùng sửa một ví | SQL transaction + `SELECT ... FOR UPDATE` |
| Deadlock khi chuyển chéo | Luôn khóa ví theo `id` tăng dần |
| Gửi trùng yêu cầu | Idempotency key + ràng buộc `UNIQUE (user_id, idempotency_key)` |
| Sửa lịch sử giao dịch | Trigger trong DB chặn `UPDATE`/`DELETE` trên sổ cái |
| Số dư âm | `CHECK (balance >= 0)`, tiền lưu bằng `BIGINT` |

## Công nghệ

Node.js 24, Express 5, EJS, PostgreSQL 18 (SQL thuần với `pg`, không ORM), joi, bcrypt, JWT, helmet, rate limit, jest + supertest, docker. Triển khai: Render (web), Neon (database), Brevo (email).

## Chạy dự án

Yêu cầu: Docker Desktop.

1. Tạo file `.env` ở thư mục gốc:

   ```
   JWT_SECRET=<chuoi-ngau-nhien-dai-it-nhat-16-ky-tu>
   DB_PASSWORD=<mat-khau-bat-ky>
   ```

2. Chạy:

   ```powershell
   docker compose up --build
   ```

3. Mở http://localhost:3000 và đăng nhập bằng tài khoản demo.

Không dùng Docker: cần Node.js 24 và PostgreSQL 18, copy `.env.example` thành `.env`, rồi `npm install`, `npm run db:migrate`, `npm run db:seed`, `npm run dev`.

## Kiểm thử

```powershell
npm run test:db   # chuẩn bị DB test (một lần)
npm test
```

Bao gồm: nạp/rút/chuyển, sai PIN và khóa PIN, idempotency đồng thời, race condition, deadlock chéo, sổ cái bất biến, phân quyền.

## Hạn chế

- Nạp tiền và SMS là **giả lập**; chưa dùng cho tiền thật.
- JWT cũ chưa bị vô hiệu sau khi đổi mật khẩu.
- OTP giao dịch lớn chưa gắn với số tiền và người nhận.
- Chưa có hạn mức theo ngày và phí giao dịch.