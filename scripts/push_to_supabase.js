import { createClient } from "@supabase/supabase-js";
import * as seedData from "../src/data/realLedgerSeedData.js";

const DEFAULT_SUPABASE_URL = "https://rjhysdktkkeqieeuelee.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqaHlzZGt0a2tlcWllZXVlbGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MzEyMzYsImV4cCI6MjEwMjUwNzIzNn0.S5VUcWpPXaJFHXgZZfYG5is6uWkmc7LubhutxbzM9Kw";

const supabase = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY);

async function run() {
  console.log("Preparing payload from realLedgerSeedData.js...");
  
  const payload = {
    system: "AdPulse ERP Financial System",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    lastSavedBy: "Automated Seed & Reconcile Engine",
    data: {
      journal: seedData.REAL_JOURNAL,
      invoices: seedData.REAL_INVOICES,
      expenses: seedData.REAL_EXPENSES,
      purchaseOrders: seedData.REAL_PURCHASE_ORDERS || [],
      releaseOrders: seedData.REAL_RELEASE_ORDERS || [],
      projects: seedData.REAL_PROJECTS,
      bankAccounts: seedData.REAL_BANK_ACCOUNTS,
      hoardings: seedData.REAL_HOARDINGS,
      inventoryItems: [],
      inventoryLogs: [],
      vouchers: seedData.REAL_VOUCHERS,
      documents: [],
      employees: [],
      leaveRequests: [],
      payrollRuns: [],
      usersList: [],
      clients: seedData.REAL_CLIENTS,
      vendors: seedData.REAL_VENDORS,
      auditLogs: [],
      monthlyAttendance: {}
    }
  };

  console.log(`Pushing snapshot to Supabase (${DEFAULT_SUPABASE_URL})...`);
  const { data, error } = await supabase
    .from("system_snapshots")
    .upsert({
      id: "latest",
      system_name: payload.system,
      version: payload.version,
      updated_at: new Date().toISOString(),
      updated_by: payload.lastSavedBy,
      payload: payload.data
    }, { onConflict: "id" });

  if (error) {
    console.error("Supabase upsert error:", error);
    process.exit(1);
  }

  console.log("✓ Successfully pushed updated state to Supabase Cloud Database!");
}

run();
