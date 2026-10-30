CREATE TABLE transactions (
  id                 BIGSERIAL PRIMARY KEY,
  reference_code     VARCHAR(30) NOT NULL UNIQUE,
  type               VARCHAR(10) NOT NULL,
  status             VARCHAR(10) NOT NULL DEFAULT 'success',
  amount             BIGINT      NOT NULL,
  from_wallet_id     BIGINT REFERENCES wallets(id) ON DELETE RESTRICT,
  to_wallet_id       BIGINT REFERENCES wallets(id) ON DELETE RESTRICT,
  from_balance_after BIGINT,
  to_balance_after   BIGINT,
  note               VARCHAR(255),
  user_id            BIGINT      NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  idempotency_key    VARCHAR(64) NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tx_amount_positive CHECK (amount > 0),
  CONSTRAINT tx_type_valid      CHECK (type IN ('deposit', 'withdraw', 'transfer')),
  CONSTRAINT tx_status_valid    CHECK (status IN ('success', 'failed')),
  CONSTRAINT tx_wallets_by_type CHECK (
    (type = 'deposit'  AND from_wallet_id IS NULL     AND to_wallet_id IS NOT NULL) OR
    (type = 'withdraw' AND from_wallet_id IS NOT NULL AND to_wallet_id IS NULL) OR
    (type = 'transfer' AND from_wallet_id IS NOT NULL AND to_wallet_id IS NOT NULL
                       AND from_wallet_id <> to_wallet_id)
  ),
  CONSTRAINT tx_idempotency_unique UNIQUE (user_id, idempotency_key)
);

CREATE INDEX idx_tx_from_wallet ON transactions (from_wallet_id, created_at DESC);
CREATE INDEX idx_tx_to_wallet   ON transactions (to_wallet_id, created_at DESC);