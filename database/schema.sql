-- =============================================================================
-- Bolt-Style One-Click Recognition & Checkout Database Schema
-- Database: PostgreSQL (compatible with Supabase, Neon, AWS RDS, Local Postgres)
-- =============================================================================

-- Enable pgcrypto extension for gen_random_uuid() if on older Postgres versions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Users Table
-- Stores registered users and their issued 6-digit login codes.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    auth_code VARCHAR(6) NOT NULL,
    code_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_auth_code_length CHECK (length(auth_code) = 6),
    CONSTRAINT uq_users_email_lower UNIQUE (email)
);

-- Case-insensitive lookup index on email for ultra-fast recognition check
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));

-- -----------------------------------------------------------------------------
-- 2. Orders Table
-- Stores checkout submissions. Supports both logged-in users and guest checkouts.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    shipping_name VARCHAR(200) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(50) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'United States',
    order_total NUMERIC(10, 2) NOT NULL DEFAULT 89.00,
    is_guest BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fast lookup indexes for order search & history queries
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

-- -----------------------------------------------------------------------------
-- 3. Automatic updated_at Trigger Function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
