CREATE TABLE action_otps (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action     VARCHAR(20) NOT NULL,
  otp_hash   VARCHAR(64) NOT NULL,
  attempts   SMALLINT    NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT action_otps_action_valid CHECK (action IN ('change_password', 'set_pin')),
  CONSTRAINT action_otps_one_per_action UNIQUE (user_id, action)
);