-- ============================================================
-- ClothBill: Settings Migration (trip currencies + member/currency management)
-- ============================================================

-- 1. New table: trip_currencies
CREATE TABLE trip_currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  currency_code TEXT NOT NULL,
  UNIQUE(trip_id, currency_code)
);

CREATE INDEX idx_trip_currencies_trip_id ON trip_currencies(trip_id);

-- RLS
ALTER TABLE trip_currencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to trip_currencies"
  ON trip_currencies FOR SELECT
  USING (true);

-- 2. Backfill existing data
INSERT INTO trip_currencies (trip_id, currency_code)
SELECT DISTINCT id, settlement_currency FROM trips
ON CONFLICT DO NOTHING;

INSERT INTO trip_currencies (trip_id, currency_code)
SELECT DISTINCT trip_id, currency FROM expenses
ON CONFLICT DO NOTHING;

-- 3. Update create_trip to accept currencies
CREATE OR REPLACE FUNCTION create_trip(
  p_name TEXT,
  p_password TEXT,
  p_settlement_currency TEXT DEFAULT 'CNY',
  p_currencies TEXT[] DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trip_id UUID;
  v_currency TEXT;
  v_currencies TEXT[];
BEGIN
  INSERT INTO trips (name, settlement_currency, password_hash)
  VALUES (p_name, p_settlement_currency, crypt(p_password, gen_salt('bf')))
  RETURNING id INTO v_trip_id;

  -- Default to just the settlement currency if none provided
  v_currencies := COALESCE(p_currencies, ARRAY[p_settlement_currency]);

  -- Ensure settlement currency is always included
  IF NOT p_settlement_currency = ANY(v_currencies) THEN
    v_currencies := array_append(v_currencies, p_settlement_currency);
  END IF;

  FOREACH v_currency IN ARRAY v_currencies
  LOOP
    INSERT INTO trip_currencies (trip_id, currency_code)
    VALUES (v_trip_id, v_currency)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN v_trip_id;
END;
$$;

-- 4. add_trip_currency
CREATE OR REPLACE FUNCTION add_trip_currency(
  p_trip_id UUID,
  p_password TEXT,
  p_currency_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT verify_trip_password(p_trip_id, p_password) THEN
    RAISE EXCEPTION 'Invalid password';
  END IF;

  INSERT INTO trip_currencies (trip_id, currency_code)
  VALUES (p_trip_id, p_currency_code)
  ON CONFLICT DO NOTHING;
END;
$$;

-- 5. remove_trip_currency
CREATE OR REPLACE FUNCTION remove_trip_currency(
  p_trip_id UUID,
  p_password TEXT,
  p_currency_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  IF NOT verify_trip_password(p_trip_id, p_password) THEN
    RAISE EXCEPTION 'Invalid password';
  END IF;

  -- Check if any expenses use this currency
  SELECT COUNT(*) INTO v_count
  FROM expenses
  WHERE trip_id = p_trip_id AND currency = p_currency_code;

  IF v_count > 0 THEN
    RAISE EXCEPTION '该币种已被 % 笔消费使用，无法移除', v_count;
  END IF;

  -- Check if it's the settlement currency
  IF EXISTS (SELECT 1 FROM trips WHERE id = p_trip_id AND settlement_currency = p_currency_code) THEN
    RAISE EXCEPTION '无法移除结算货币';
  END IF;

  DELETE FROM trip_currencies
  WHERE trip_id = p_trip_id AND currency_code = p_currency_code;
END;
$$;

-- 6. update_settlement_currency
CREATE OR REPLACE FUNCTION update_settlement_currency(
  p_trip_id UUID,
  p_password TEXT,
  p_currency_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT verify_trip_password(p_trip_id, p_password) THEN
    RAISE EXCEPTION 'Invalid password';
  END IF;

  -- Verify currency is in trip_currencies
  IF NOT EXISTS (
    SELECT 1 FROM trip_currencies
    WHERE trip_id = p_trip_id AND currency_code = p_currency_code
  ) THEN
    RAISE EXCEPTION '该货币不在旅行币种列表中';
  END IF;

  UPDATE trips
  SET settlement_currency = p_currency_code, updated_at = now()
  WHERE id = p_trip_id;
END;
$$;

-- 7. update_member
CREATE OR REPLACE FUNCTION update_member(
  p_trip_id UUID,
  p_password TEXT,
  p_member_id UUID,
  p_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT verify_trip_password(p_trip_id, p_password) THEN
    RAISE EXCEPTION 'Invalid password';
  END IF;

  -- Verify member belongs to trip
  IF NOT EXISTS (SELECT 1 FROM members WHERE id = p_member_id AND trip_id = p_trip_id) THEN
    RAISE EXCEPTION '成员不属于该旅行';
  END IF;

  UPDATE members SET name = p_name WHERE id = p_member_id AND trip_id = p_trip_id;
END;
$$;

-- 8. remove_member
CREATE OR REPLACE FUNCTION remove_member(
  p_trip_id UUID,
  p_password TEXT,
  p_member_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  IF NOT verify_trip_password(p_trip_id, p_password) THEN
    RAISE EXCEPTION 'Invalid password';
  END IF;

  -- Verify member belongs to trip
  IF NOT EXISTS (SELECT 1 FROM members WHERE id = p_member_id AND trip_id = p_trip_id) THEN
    RAISE EXCEPTION '成员不属于该旅行';
  END IF;

  -- Check expenses where member is payer
  SELECT COUNT(*) INTO v_count
  FROM expenses
  WHERE trip_id = p_trip_id AND paid_by = p_member_id;

  IF v_count > 0 THEN
    RAISE EXCEPTION '该成员有 % 笔消费记录，无法删除', v_count;
  END IF;

  -- Check expense_splits referencing member
  SELECT COUNT(*) INTO v_count
  FROM expense_splits es
  JOIN expenses e ON e.id = es.expense_id
  WHERE e.trip_id = p_trip_id AND es.member_id = p_member_id;

  IF v_count > 0 THEN
    RAISE EXCEPTION '该成员参与了 % 笔消费分摊，无法删除', v_count;
  END IF;

  DELETE FROM members WHERE id = p_member_id AND trip_id = p_trip_id;
END;
$$;
