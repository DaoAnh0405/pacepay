CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
  id                  BIGSERIAL PRIMARY KEY,
  full_name           VARCHAR(100) NOT NULL,
  email               VARCHAR(255) NOT NULL UNIQUE,
  phone               VARCHAR(20)  UNIQUE,
  password_hash       VARCHAR(255) NOT NULL,
  pin_hash            VARCHAR(255),
  failed_pin_attempts SMALLINT     NOT NULL DEFAULT 0,
  pin_locked_until    TIMESTAMPTZ,
  role                VARCHAR(10)  NOT NULL DEFAULT 'user',
  status              VARCHAR(10)  NOT NULL DEFAULT 'active',
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT users_email_lowercase CHECK (email = LOWER(email)),
  CONSTRAINT users_role_valid      CHECK (role IN ('user', 'admin')),
  CONSTRAINT users_status_valid    CHECK (status IN ('active', 'locked'))
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();