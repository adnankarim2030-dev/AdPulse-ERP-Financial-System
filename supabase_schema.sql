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

-- 3. Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  client_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  ntn TEXT,
  strn TEXT,
  payment_terms TEXT,
  credit_limit NUMERIC(15, 2) DEFAULT 0,
  opening_balance NUMERIC(15, 2) DEFAULT 0,
  status TEXT DEFAULT 'Active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- 4. Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  vendor_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  ntn TEXT,
  strn TEXT,
  payment_terms TEXT,
  bank_name TEXT,
  bank_account_title TEXT,
  account_number_iban TEXT,
  opening_balance NUMERIC(15, 2) DEFAULT 0,
  status TEXT DEFAULT 'Active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- 5. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  project_code TEXT,
  name TEXT NOT NULL,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  client TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  budget NUMERIC(15, 2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  assigned_staff TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- 6. Service Lines Table
CREATE TABLE IF NOT EXISTS service_lines (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_no TEXT UNIQUE NOT NULL,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  service_line_id TEXT REFERENCES service_lines(id) ON DELETE SET NULL,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- 8. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  expense_no TEXT UNIQUE NOT NULL,
  vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  service_line_id TEXT REFERENCES service_lines(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  vendor TEXT,
  date DATE NOT NULL,
  amount NUMERIC(15, 2) DEFAULT 0,
  status TEXT DEFAULT 'Unpaid',
  payment_via TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- 9. Vouchers Table
CREATE TABLE IF NOT EXISTS vouchers (
  id TEXT PRIMARY KEY,
  voucher_no TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  party_type TEXT DEFAULT 'Client',
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  bank_account_id TEXT,
  party TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(15, 2) DEFAULT 0,
  via TEXT DEFAULT 'Bank',
  status TEXT DEFAULT 'Posted',
  created_by TEXT,
  posted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_type TEXT,
  record_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Journal Entries Table
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  lines JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Bank Accounts Table
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
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Allow Public Access Policies (for Anon API Key usage)
DROP POLICY IF EXISTS "Allow anon all" ON system_snapshots;
CREATE POLICY "Allow anon all" ON system_snapshots FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow anon users" ON app_users;
CREATE POLICY "Allow anon users" ON app_users FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow anon clients" ON clients;
CREATE POLICY "Allow anon clients" ON clients FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow anon vendors" ON vendors;
CREATE POLICY "Allow anon vendors" ON vendors FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow anon projects" ON projects;
CREATE POLICY "Allow anon projects" ON projects FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow anon service_lines" ON service_lines;
CREATE POLICY "Allow anon service_lines" ON service_lines FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow anon invoices" ON invoices;
CREATE POLICY "Allow anon invoices" ON invoices FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow anon expenses" ON expenses;
CREATE POLICY "Allow anon expenses" ON expenses FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow anon vouchers" ON vouchers;
CREATE POLICY "Allow anon vouchers" ON vouchers FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow anon audit_logs" ON audit_logs;
CREATE POLICY "Allow anon audit_logs" ON audit_logs FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow anon journal" ON journal_entries;
CREATE POLICY "Allow anon journal" ON journal_entries FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow anon bank_accounts" ON bank_accounts;
CREATE POLICY "Allow anon bank_accounts" ON bank_accounts FOR ALL USING (true);


