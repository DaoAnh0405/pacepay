CREATE TABLE wallets (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT      NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  balance    BIGINT      NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT wallets_balance_non_negative CHECK (balance >= 0)
);

CREATE TRIGGER trg_wallets_updated_at
BEFORE UPDATE ON wallets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();