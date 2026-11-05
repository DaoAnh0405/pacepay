CREATE TABLE password_resets (
  id             BIGSERIAL PRIMARY KEY,
  token_hash     VARCHAR(64) NOT NULL UNIQUE,
  user_id        BIGINT      REFERENCES users(id) ON DELETE CASCADE,
  otp_hash       VARCHAR(64),
  otp_expires_at TIMESTAMPTZ,
  otp_attempts   SMALLINT    NOT NULL DEFAULT 0,
  verified       BOOLEAN     NOT NULL DEFAULT FALSE,
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '15 minutes',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);