import XLSX from 'xlsx';
import {
  REAL_CLIENTS,
  REAL_VENDORS,
  REAL_INVOICES,
  REAL_EXPENSES,
  REAL_VOUCHERS,
  REAL_JOURNAL
} from '../src/data/realLedgerSeedData.js';

console.log("=============================================================================");
console.log("       IN-DEPTH ACCOUNTING INTEGRITY & DIRECTION AUDIT (NO INVERSIONS)        ");
console.log("=============================================================================");

// 1. CLIENT DIRECTION CHECK
console.log("\n>>> 1. CHECKING CLIENTS (Receivables: Invoices Dr, Receipts Cr)...");
let clientErrors = 0;
for (const c of REAL_CLIENTS) {
  const invs = REAL_INVOICES.filter(i => i.clientId === c.id);
  const vchs = REAL_VOUCHERS.filter(v => v.clientId === c.id);
  
  const sumInvs = invs.reduce((s, i) => s + Number(i.totalAmount || i.amount || 0), 0);
  const sumVchs = vchs.reduce((s, v) => s + Number(v.amount || 0), 0);
  const ob = Number(c.openingBalance || 0);
  const expectedClosing = ob + sumInvs - sumVchs;
  const currentBal = Number(c.currentBalance || 0);

  const diff = Math.abs(expectedClosing - currentBal);
  if (diff > 0.01) {
    console.error(`[MISMATCH] CLIENT: [${c.clientCode}] ${c.name} | Expected: ${expectedClosing} | Got: ${currentBal}`);
    clientErrors++;
  }

  // Check that all vouchers for client are type RV
  for (const v of vchs) {
    if (v.type !== 'RV' && v.type !== 'CRV' && v.type !== 'CV' && v.type !== 'BRV') {
      console.error(`[WRONG VOUCHER TYPE] CLIENT: [${c.name}] Voucher ${v.voucherNo} has type ${v.type}`);
      clientErrors++;
    }
  }
}
if (clientErrors === 0) {
  console.log(`✓ All ${REAL_CLIENTS.length} Clients have correct Debit (Invoice) / Credit (Receipt) flow and matching closing balances!`);
}

// 2. VENDOR DIRECTION CHECK
console.log("\n>>> 2. CHECKING VENDORS (Payables: Bills Cr, Payments Dr)...");
let vendorErrors = 0;
for (const v of REAL_VENDORS) {
  const exps = REAL_EXPENSES.filter(e => e.vendorId === v.id);
  const vchs = REAL_VOUCHERS.filter(vch => vch.vendorId === v.id);

  const sumExps = exps.reduce((s, e) => s + Number(e.amount || 0), 0);
  const sumVchs = vchs.reduce((s, vch) => s + Number(vch.amount || 0), 0);
  const ob = Number(v.openingBalance || 0);
  const expectedClosing = ob + sumExps - sumVchs;
  const currentBal = Number(v.currentBalance || 0);

  const diff = Math.abs(expectedClosing - currentBal);
  if (diff > 0.01) {
    console.error(`[MISMATCH] VENDOR: [${v.vendorCode}] ${v.name} | Expected: ${expectedClosing} | Got: ${currentBal}`);
    vendorErrors++;
  }

  // Check that all vouchers for vendor are type PV
  for (const vch of vchs) {
    if (vch.type !== 'PV' && vch.type !== 'CPV' && vch.type !== 'BPV') {
      console.error(`[WRONG VOUCHER TYPE] VENDOR: [${v.name}] Voucher ${vch.voucherNo} has type ${vch.type}`);
      vendorErrors++;
    }
  }
}
if (vendorErrors === 0) {
  console.log(`✓ All ${REAL_VENDORS.length} Vendors have correct Credit (Bill) / Debit (Payment) flow and matching closing balances!`);
}

// 3. GL JOURNAL ENTRIES INTEGRITY
console.log("\n>>> 3. CHECKING GENERAL LEDGER DOUBLE-ENTRY BALANCING...");
let glErrors = 0;
let totalDebits = 0;
let totalCredits = 0;

for (const entry of REAL_JOURNAL) {
  let entryDebits = 0;
  let entryCredits = 0;
  for (const line of entry.lines) {
    entryDebits += Number(line.debit || 0);
    entryCredits += Number(line.credit || 0);
  }
  totalDebits += entryDebits;
  totalCredits += entryCredits;
  if (Math.abs(entryDebits - entryCredits) > 0.01) {
    console.error(`[UNBALANCED] JOURNAL ENTRY: ${entry.id} (${entry.reference}) | Debits: ${entryDebits} | Credits: ${entryCredits}`);
    glErrors++;
  }
}

console.log(`Total Debits:   PKR ${totalDebits.toLocaleString()}`);
console.log(`Total Credits:  PKR ${totalCredits.toLocaleString()}`);
console.log(`GL Discrepancy: PKR ${Math.abs(totalDebits - totalCredits).toFixed(2)}`);

if (glErrors === 0 && Math.abs(totalDebits - totalCredits) < 0.01) {
  console.log(`✓ All ${REAL_JOURNAL.length} General Ledger entries are 100% perfectly balanced!`);
}
