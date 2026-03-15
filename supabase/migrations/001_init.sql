-- ============================================================
-- ClothBill: Initial Migration
-- ============================================================

-- 1. Enable pgcrypto extension (for crypt / gen_salt / gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 2. Tables
-- ============================================================

CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  settlement_currency TEXT NOT NULL DEFAULT 'CNY',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL,
  paid_by UUID REFERENCES members(id),
  split_type TEXT NOT NULL DEFAULT 'equal',
  category TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_in DATE,
  check_out DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id),
  share_amount NUMERIC(12,2),
  share_percentage NUMERIC(5,2),
  UNIQUE(expense_id, member_id)
);

-- ============================================================
-- 3. Indexes
-- ============================================================

CREATE INDEX idx_members_trip_id ON members(trip_id);
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_member_id ON expense_splits(member_id);

-- ============================================================
-- 4. RPC Functions (all SECURITY DEFINER)
-- ============================================================

-- 4a. create_trip
CREATE OR REPLACE FUNCTION create_trip(
  p_name TEXT,
  p_password TEXT,
  p_settlement_currency TEXT DEFAULT 'CNY'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trip_id UUID;
BEGIN
  INSERT INTO trips (name, settlement_currency, password_hash)
  VALUES (p_name, p_settlement_currency, crypt(p_password, gen_salt('bf')))
  RETURNING id INTO v_trip_id;

  RETURN v_trip_id;
END;
$$;

-- 4b. verify_trip_password
CREATE OR REPLACE FUNCTION verify_trip_password(
  p_trip_id UUID,
  p_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  SELECT password_hash INTO v_hash
  FROM trips
  WHERE id = p_trip_id;

  IF v_hash IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN crypt(p_password, v_hash) = v_hash;
END;
$$;

-- 4c. add_member
CREATE OR REPLACE FUNCTION add_member(
  p_trip_id UUID,
  p_password TEXT,
  p_name TEXT,
  p_avatar TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member_id UUID;
BEGIN
  IF NOT verify_trip_password(p_trip_id, p_password) THEN
    RAISE EXCEPTION 'Invalid password';
  END IF;

  INSERT INTO members (trip_id, name, avatar)
  VALUES (p_trip_id, p_name, p_avatar)
  RETURNING id INTO v_member_id;

  RETURN v_member_id;
END;
$$;

-- 4d. add_expense
CREATE OR REPLACE FUNCTION add_expense(
  p_trip_id UUID,
  p_password TEXT,
  p_description TEXT,
  p_amount NUMERIC,
  p_currency TEXT,
  p_paid_by UUID,
  p_split_type TEXT DEFAULT 'equal',
  p_category TEXT DEFAULT NULL,
  p_date TIMESTAMPTZ DEFAULT now(),
  p_check_in DATE DEFAULT NULL,
  p_check_out DATE DEFAULT NULL,
  p_splits JSONB DEFAULT '[]'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expense_id UUID;
  v_split JSONB;
BEGIN
  IF NOT verify_trip_password(p_trip_id, p_password) THEN
    RAISE EXCEPTION 'Invalid password';
  END IF;

  INSERT INTO expenses (trip_id, description, amount, currency, paid_by, split_type, category, date, check_in, check_out)
  VALUES (p_trip_id, p_description, p_amount, p_currency, p_paid_by, p_split_type, p_category, p_date, p_check_in, p_check_out)
  RETURNING id INTO v_expense_id;

  FOR v_split IN SELECT * FROM jsonb_array_elements(p_splits)
  LOOP
    INSERT INTO expense_splits (expense_id, member_id, share_amount, share_percentage)
    VALUES (
      v_expense_id,
      (v_split ->> 'member_id')::UUID,
      (v_split ->> 'share_amount')::NUMERIC,
      (v_split ->> 'share_percentage')::NUMERIC
    );
  END LOOP;

  RETURN v_expense_id;
END;
$$;

-- 4e. update_expense
CREATE OR REPLACE FUNCTION update_expense(
  p_trip_id UUID,
  p_password TEXT,
  p_expense_id UUID,
  p_description TEXT,
  p_amount NUMERIC,
  p_currency TEXT,
  p_paid_by UUID,
  p_split_type TEXT DEFAULT 'equal',
  p_category TEXT DEFAULT NULL,
  p_date TIMESTAMPTZ DEFAULT now(),
  p_check_in DATE DEFAULT NULL,
  p_check_out DATE DEFAULT NULL,
  p_splits JSONB DEFAULT '[]'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_split JSONB;
BEGIN
  IF NOT verify_trip_password(p_trip_id, p_password) THEN
    RAISE EXCEPTION 'Invalid password';
  END IF;

  UPDATE expenses
  SET description = p_description,
      amount = p_amount,
      currency = p_currency,
      paid_by = p_paid_by,
      split_type = p_split_type,
      category = p_category,
      date = p_date,
      check_in = p_check_in,
      check_out = p_check_out
  WHERE id = p_expense_id AND trip_id = p_trip_id;

  DELETE FROM expense_splits WHERE expense_id = p_expense_id;

  FOR v_split IN SELECT * FROM jsonb_array_elements(p_splits)
  LOOP
    INSERT INTO expense_splits (expense_id, member_id, share_amount, share_percentage)
    VALUES (
      p_expense_id,
      (v_split ->> 'member_id')::UUID,
      (v_split ->> 'share_amount')::NUMERIC,
      (v_split ->> 'share_percentage')::NUMERIC
    );
  END LOOP;

  RETURN p_expense_id;
END;
$$;

-- 4f. delete_expense
CREATE OR REPLACE FUNCTION delete_expense(
  p_trip_id UUID,
  p_password TEXT,
  p_expense_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT verify_trip_password(p_trip_id, p_password) THEN
    RAISE EXCEPTION 'Invalid password';
  END IF;

  -- expense_splits are deleted automatically via ON DELETE CASCADE
  DELETE FROM expenses WHERE id = p_expense_id AND trip_id = p_trip_id;
END;
$$;

-- ============================================================
-- 5. Row Level Security
-- ============================================================

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- Read-only policies (SELECT for anon and authenticated roles).
-- All mutations go through SECURITY DEFINER RPC functions above.

CREATE POLICY "Allow read access to trips"
  ON trips FOR SELECT
  USING (true);

CREATE POLICY "Allow read access to members"
  ON members FOR SELECT
  USING (true);

CREATE POLICY "Allow read access to expenses"
  ON expenses FOR SELECT
  USING (true);

CREATE POLICY "Allow read access to expense_splits"
  ON expense_splits FOR SELECT
  USING (true);
