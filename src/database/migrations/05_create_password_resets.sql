CREATE TABLE password_resets (
  id                   BIGSERIAL PRIMARY KEY,
  token_hash           VARCHAR(64) NOT NULL UNIQUE,
  user_id              BIGINT      REFERENCES users(id) ON DELETE CASCADE,

  email_otp_hash       VARCHAR(64),
  email_otp_expires_at TIMESTAMPTZ,
  email_otp_attempts   SMALLINT    NOT NULL DEFAULT 0,
  email_verified       BOOLEAN     NOT NULL DEFAULT FALSE,

  phone_otp_hash       VARCHAR(64),
  phone_otp_expires_at TIMESTAMPTZ,
  phone_otp_attempts   SMALLINT    NOT NULL DEFAULT 0,
  phone_verified       BOOLEAN     NOT NULL DEFAULT FALSE,

  expires_at           TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '15 minutes',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);