-- SlimWay OS Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(80)  NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'coach')),
  height_cm     SMALLINT,
  birth_date    DATE,
  gender        VARCHAR(10)  CHECK (gender IN ('male', 'female', 'other')),
  target_weight_kg NUMERIC(5,2),
  activity_level   VARCHAR(20) CHECK (activity_level IN ('sedentary','light','moderate','active','very_active')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weight records
CREATE TABLE IF NOT EXISTS weight_records (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight_kg  NUMERIC(5,2) NOT NULL CHECK (weight_kg > 0),
  date       DATE        NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_weight_user_date ON weight_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_weight_user_id ON weight_records(user_id);

-- Nutrition logs
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       DATE    NOT NULL,
  calories   INTEGER NOT NULL DEFAULT 0,
  protein_g  NUMERIC(6,1) NOT NULL DEFAULT 0,
  fat_g      NUMERIC(6,1) NOT NULL DEFAULT 0,
  carb_g     NUMERIC(6,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_nutrition_user_date ON nutrition_logs(user_id, date);

-- Meals
CREATE TABLE IF NOT EXISTS meals (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutrition_log_id UUID NOT NULL REFERENCES nutrition_logs(id) ON DELETE CASCADE,
  name           VARCHAR(200) NOT NULL,
  calories       INTEGER      NOT NULL DEFAULT 0,
  protein_g      NUMERIC(6,1) NOT NULL DEFAULT 0,
  fat_g          NUMERIC(6,1) NOT NULL DEFAULT 0,
  carb_g         NUMERIC(6,1) NOT NULL DEFAULT 0,
  time           TIME,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_nutrition_updated_at
  BEFORE UPDATE ON nutrition_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
