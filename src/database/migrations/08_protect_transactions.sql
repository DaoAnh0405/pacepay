CREATE OR REPLACE FUNCTION forbid_tx_change()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Bảng transactions chỉ được thêm, không được sửa hoặc xóa';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tx_immutable
BEFORE UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION forbid_tx_change();