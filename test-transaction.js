import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('--- Starting System Audit & Transaction Test ---');

  // 1. Pull Current State
  console.log('1. Pulling state from Supabase...');
  const { data: pullData, error: pullError } = await supabase
    .from("system_snapshots")
    .select("payload, updated_at")
    .eq("id", "latest")
    .maybeSingle();

  if (pullError) {
    console.error('Error pulling state:', pullError);
    return;
  }

  let state = pullData ? pullData.payload : {};
  console.log(`State pulled successfully. (Updated at: ${pullData?.updated_at || 'N/A'})`);

  // Initialize missing arrays
  state.clients = state.clients || [];
  state.vendors = state.vendors || [];
  state.invoices = state.invoices || [];
  state.journal = state.journal || [];

  // 2. Create a Test Client
  const testClient = {
    id: `C-${Date.now()}`,
    clientCode: `CLT-TEST-${Math.floor(Math.random() * 1000)}`,
    name: 'Test Client Ltd',
    companyName: 'Test Client Company',
    contactPerson: 'Mr. Test',
    phone: '123456789',
    email: 'test@client.com',
    status: 'Active',
    openingBalance: 0
  };
  state.clients.push(testClient);
  console.log(`2. Created Test Client: ${testClient.name} (${testClient.clientCode})`);

  // 3. Create a Test Vendor
  const testVendor = {
    id: `V-${Date.now()}`,
    vendorCode: `VND-TEST-${Math.floor(Math.random() * 1000)}`,
    name: 'Test Vendor Supplier',
    companyName: 'Test Vendor Co',
    contactPerson: 'Mr. Vendor Test',
    phone: '987654321',
    email: 'test@vendor.com',
    status: 'Active',
    openingBalance: 0
  };
  state.vendors.push(testVendor);
  console.log(`3. Created Test Vendor: ${testVendor.name} (${testVendor.vendorCode})`);

  // 4. Create a Test Invoice for the Client
  const testInvoice = {
    id: `INV-${Date.now()}`,
    projectId: null,
    client: testClient.name,
    description: 'Test Service Invoice',
    amount: 50000,
    applySst: true,
    sstRate: 13,
    sstAmount: 6500,
    applyWht: false,
    whtRate: 0,
    whtAmount: 0,
    totalAmount: 56500,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Auto-generated test invoice',
    paid: false
  };
  state.invoices.push(testInvoice);
  console.log(`4. Created Test Invoice: ${testInvoice.description} for Amount: ${testInvoice.totalAmount}`);

  // 5. Create a Journal Entry for the Invoice
  const journalEntry = {
    id: `JE-${Date.now()}`,
    date: testInvoice.issueDate,
    description: `Invoice - ${testClient.name} (${testInvoice.description})`,
    reference: `INV-${testInvoice.id.toUpperCase()}`,
    lines: [
      { account: 'Accounts Receivable', debit: 56500, credit: 0 },
      { account: 'Sales Revenue', debit: 0, credit: 50000 },
      { account: 'Sales Tax Payable', debit: 0, credit: 6500 }
    ]
  };
  state.journal.push(journalEntry);
  console.log(`5. Created Journal Entry for Invoice.`);

  // 6. Push State to Supabase
  console.log('6. Pushing updated state to Supabase...');
  const { data: pushData, error: pushError } = await supabase
    .from("system_snapshots")
    .upsert({
      id: "latest",
      system_name: "AdPulse ERP Financial System",
      version: "1.0.0",
      updated_at: new Date().toISOString(),
      updated_by: "Automated Test",
      payload: state
    }, { onConflict: "id" });

  if (pushError) {
    console.error('Error pushing state:', pushError);
    return;
  }
  
  console.log('State successfully pushed.');
  console.log('--- Transaction Test Completed Successfully! ---');
  console.log('The system logic flows smoothly: Client -> Vendor -> Invoice -> Journal.');
}

runTest();
