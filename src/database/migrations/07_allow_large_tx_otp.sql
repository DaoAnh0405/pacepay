ALTER TABLE action_otps DROP CONSTRAINT action_otps_action_valid;
ALTER TABLE action_otps ADD CONSTRAINT action_otps_action_valid
  CHECK (action IN ('change_password', 'set_pin', 'large_tx'));