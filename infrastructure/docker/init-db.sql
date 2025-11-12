-- Initialize database with extensions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'Asia/Bangkok';

-- Create initial admin user (password: admin123)
-- This will be created via migration, just a placeholder
