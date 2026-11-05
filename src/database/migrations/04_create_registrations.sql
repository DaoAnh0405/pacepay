CREATE TABLE registrations (
  id               BIGSERIAL PRIMARY KEY,
  token_hash       VARCHAR(64) NOT NULL UNIQUE,
  email            VARCHAR(255) NOT NULL,
  phone            VARCHAR(20),
  otp_hash         VARCHAR(64),
  otp_expires_at   TIMESTAMPTZ,
  otp_attempts     SMALLINT    NOT NULL DEFAULT 0,
  otp_sent_at      TIMESTAMPTZ,
  phone_verified   BOOLEAN     NOT NULL DEFAULT FALSE,
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 minutes',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);