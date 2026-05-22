CREATE EXTENSION IF NOT EXISTS postgis;

DO $$ BEGIN
  CREATE TYPE role_id AS ENUM ('SUPER_ADMIN', 'CUSTOMER', 'WAREHOUSE', 'DRIVER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'CREATED',
    'CONFIRMED',
    'ASSEMBLING',
    'LOADED',
    'IN_TRANSIT',
    'PARTIALLY_DELIVERED',
    'DELIVERED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  role role_id NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  weight NUMERIC(10,2) NOT NULL CHECK (weight >= 0),
  volume NUMERIC(10,2) NOT NULL CHECK (volume >= 0),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES users(id),
  status order_status NOT NULL DEFAULT 'CREATED',
  total_weight NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_volume NUMERIC(12,2) NOT NULL DEFAULT 0,
  goods_sum NUMERIC(14,2) NOT NULL DEFAULT 0,
  delivery_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  eta_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE TABLE IF NOT EXISTS delivery_points (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  sequence INTEGER NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trucks (
  id TEXT PRIMARY KEY,
  capacity_weight NUMERIC(12,2) NOT NULL,
  capacity_volume NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL,
  current_location geography(Point, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routes (
  id BIGSERIAL PRIMARY KEY,
  truck_id TEXT NOT NULL REFERENCES trucks(id),
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  distance NUMERIC(14,2) NOT NULL,
  eta INTEGER NOT NULL,
  geometry geography(LineString, 4326)
);

CREATE TABLE IF NOT EXISTS gps_logs (
  id BIGSERIAL PRIMARY KEY,
  truck_id TEXT NOT NULL REFERENCES trucks(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_notes (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  author_user_id BIGINT REFERENCES users(id),
  note TEXT NOT NULL CHECK (char_length(note) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_points_order_id ON delivery_points(order_id);
CREATE INDEX IF NOT EXISTS idx_gps_logs_truck_id_ts ON gps_logs(truck_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_order_notes_order_id_created_at ON order_notes(order_id, created_at DESC);