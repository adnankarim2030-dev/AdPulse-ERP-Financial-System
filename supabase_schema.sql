-- ====================================================================
-- ADPULSE ERP FINANCIAL SYSTEM - SUPABASE DATABASE SCHEMA MIGRATION
-- Copy and run this script in your Supabase Dashboard -> SQL Editor
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. System Settings & Snapshots Table
CREATE TABLE IF NOT EXISTS system_snapshots (
  id TEXT PRIMARY KEY DEFAULT 'latest',
  system_name TEXT DEFAULT 'AdPulse ERP Financial System',
  version TEXT DEFAULT '1.0.0',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT,
  payload JSONB NOT NULL
);

-- 3. Users Table
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'Staff',
  department TEXT DEFAULT 'General',
  allowed_tabs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  project_code TEXT,
  name TEXT NOT NULL,
  client TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  budget NUMERIC(15, 2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_no TEXT UNIQUE NOT NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE,
  amount NUMERIC(15, 2) DEFAULT 0,
  status TEXT DEFAULT 'Unpaid',
  apply_sst BOOLEAN DEFAULT FALSE,
  sst_amount NUMERIC(15, 2) DEFAULT 0,
  apply_wht BOOLEAN DEFAULT FALSE,
  wht_amount NUMERIC(15, 2) DEFAULT 0,
  total_amount NUMERIC(15, 2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  expense_no TEXT UNIQUE NOT NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  vendor TEXT,
  date DATE NOT NULL,
  amount NUMERIC(15, 2) DEFAULT 0,
  status TEXT DEFAULT 'Unpaid',
  payment_via TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Journal Entries Table
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  lines JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Bank Accounts Table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id TEXT PRIMARY KEY,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  branch_code TEXT,
  type TEXT DEFAULT 'Bank',
  opening_balance NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Enable
ALTER TABLE system_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Allow Public Access Policy (for Anon API Key usage)
CREATE POLICY "Allow anon read all" ON system_snapshots FOR SELECT USING (true);
CREATE POLICY "Allow anon write all" ON system_snapshots FOR ALL USING (true);

CREATE POLICY "Allow anon read users" ON app_users FOR SELECT USING (true);
CREATE POLICY "Allow anon write users" ON app_users FOR ALL USING (true);

CREATE POLICY "Allow anon read projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow anon write projects" ON projects FOR ALL USING (true);

CREATE POLICY "Allow anon read invoices" ON invoices FOR SELECT USING (true);
CREATE POLICY "Allow anon write invoices" ON invoices FOR ALL USING (true);

CREATE POLICY "Allow anon read expenses" ON expenses FOR SELECT USING (true);
CREATE POLICY "Allow anon write expenses" ON expenses FOR ALL USING (true);

CREATE POLICY "Allow anon read journal" ON journal_entries FOR SELECT USING (true);
CREATE POLICY "Allow anon write journal" ON journal_entries FOR ALL USING (true);

CREATE POLICY "Allow anon read bank_accounts" ON bank_accounts FOR SELECT USING (true);
CREATE POLICY "Allow anon write bank_accounts" ON bank_accounts FOR ALL USING (true);
