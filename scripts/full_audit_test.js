import XLSX from 'xlsx';
import {
  REAL_CLIENTS,
  REAL_VENDORS,
  REAL_INVOICES,
  REAL_EXPENSES,
  REAL_VOUCHERS,
  REAL_JOURNAL
} from '../src/data/realLedgerSeedData.js';

function cleanNum(val) {
  if (val === null || val === undefined) return 0;
  const s = String(val).replace(/,/g, '').replace(/\s+/g, '').replace(/\(/g, '-').replace(/\)/g, '');
  if (!s || s === '-' || s === '—') return 0;
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

console.log("===============================================================================");
console.log("             COMPREHENSIVE FINANCIAL AUDIT TEST: EXCEL VS ERP                  ");
console.log("===============================================================================");

// ---------------------------------------------------------
// 1. AUDIT ALL 35 CLIENTS
// ---------------------------------------------------------
const clientWb = XLSX.readFile('./CLIENT BALANCE PAYMENT AND LEDGERS  (1).xlsx');
console.log(`\n>>> AUDITING CLIENTS (${clientWb.SheetNames.length} Excel Sheets vs ${REAL_CLIENTS.length} ERP Clients)...\n`);

let clientPassCount = 0;
let clientFailCount = 0;
const clientAuditResults = [];

for (const sheetName of clientWb.SheetNames) {
  const sheet = clientWb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  let tables = [];
  let curTable = null;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || [];
    const rStr = r.map(c => c ? String(c).trim().toLowerCase() : '');
    const isHeader = rStr.some(c => c.includes('date')) && (rStr.some(c => c.includes('amount') || c.includes('recevied') || c.includes('received') || c.includes('paid') || c.includes('adjustment') || c.includes('balance')));
    
    if (isHeader) {
      if (curTable) tables.push(curTable);
      curTable = { headerIdx: i, headerRow: r, rows: [] };
      continue;
    }

    if (curTable) {
      const isTotal = rStr.some(c => c === 'total' || c === 'total amount' || c.includes('grand total') || c === 'total balance amount' || c === 'total vouchers');
      if (isTotal) {
        curTable.totalRow = r;
        tables.push(curTable);
        curTable = null;
        continue;
      }
      if (r.some(c => c && String(c).trim())) {
        curTable.rows.push(r);
      }
    }
  }
  if (curTable) tables.push(curTable);

  if (sheetName === 'SUNRIDGE' && tables.length >= 2) {
    tables = [tables[1]]; // Full consolidated table
  }

  let excelOB = 0;
  let excelBilled = 0;
  let excelReceived = 0;



  for (const t of tables) {
    const h = (t.headerRow || []).map(c => c ? String(c).trim().toLowerCase() : '');
    let colDate = -1, colRef = -1, colDesc = -1, colAmt = -1, colRec = -1, colBal = -1;

    for (let c = 0; c < h.length; c++) {
      const hc = h[c] || '';
      if (hc.includes('date') && colDate === -1) colDate = c;
      else if ((hc === 'p/r' || hc === 'pr' || hc === 'p / r' || hc.includes('inv') || hc.includes('reference') || hc.includes('ref') || hc === 's/no.' || hc === 'sr') && colRef === -1) colRef = c;
      else if (hc.includes('desc') || hc.includes('particular') || hc.includes('disc')) colDesc = c;
      else if ((hc.includes('amount') || hc.includes('bill') || hc.includes('inv amount')) && !hc.includes('recevied') && !hc.includes('received') && colAmt === -1) colAmt = c;
      else if ((hc.includes('recevied') || hc.includes('received') || hc.includes('paid') || hc.includes('adjustment')) && colRec === -1) colRec = c;
      else if (hc.includes('balance') && colBal === -1) colBal = c;
    }

    for (const r of t.rows) {
      const desc = colDesc !== -1 && r[colDesc] !== null ? String(r[colDesc]).trim() : '';
      const ref = colRef !== -1 && r[colRef] !== null ? String(r[colRef]).trim() : '';
      const rawAmt = colAmt !== -1 ? r[colAmt] : null;
      const rawRec = colRec !== -1 ? r[colRec] : null;
      const rawBal = colBal !== -1 ? r[colBal] : null;

      const numAmt = cleanNum(rawAmt);
      const numRec = cleanNum(rawRec);
      const numBal = cleanNum(rawBal);

      if (desc.toUpperCase().includes('B/F') || ref.toUpperCase().includes('B/F') || desc.toUpperCase().includes('OPENING') || ref.toUpperCase().includes('OPENING')) {
        const obVal = rawBal !== null && rawBal !== undefined && String(rawBal).trim() !== '' ? numBal : (rawAmt !== null && rawAmt !== undefined && String(rawAmt).trim() !== '' ? numAmt : numBal);
        excelOB += obVal;
        continue;
      }

      if (r.some(c => c && String(c).toUpperCase().includes('CANCELLED'))) continue;
      if (numAmt === 0 && numRec === 0) continue;

      if (numAmt > 0) excelBilled += numAmt;
      if (numRec > 0) excelReceived += numRec;
    }
  }

  const excelClosing = excelOB + excelBilled - excelReceived;

  // Find matching ERP client
  const erpClient = REAL_CLIENTS.find(c => c.name.trim().toLowerCase() === sheetName.trim().toLowerCase());

  if (!erpClient) {
    clientFailCount++;
    clientAuditResults.push({
      clientCode: "—",
      name: sheetName,
      sheetName,
      excelOB,
      erpOB: 0,
      excelBilled,
      erpBilled: 0,
      excelReceived,
      erpReceived: 0,
      excelClosing,
      erpClosing: null,
      diff: excelClosing,
      status: "MISSING IN ERP"
    });
    continue;
  }

  const clientInvoices = REAL_INVOICES.filter(i => i.clientId === erpClient.id);
  const clientVouchers = REAL_VOUCHERS.filter(v => v.clientId === erpClient.id);

  const erpBilled = clientInvoices.reduce((s, i) => s + (Number(i.totalAmount || i.amount) || 0), 0);
  const erpReceived = clientVouchers.filter(v => v.type === "RV" || v.type === "CV").reduce((s, v) => s + (Number(v.amount) || 0), 0);
  const erpOB = Number(erpClient.openingBalance) || 0;
  const erpClosing = erpOB + erpBilled - erpReceived;

  const diff = Math.abs(excelClosing - erpClosing);
  const isMatch = diff < 0.01;

  if (isMatch) clientPassCount++;
  else clientFailCount++;

  clientAuditResults.push({
    clientCode: erpClient.clientCode,
    name: erpClient.name,
    sheetName,
    excelOB,
    erpOB,
    excelBilled,
    erpBilled,
    excelReceived,
    erpReceived,
    excelClosing,
    erpClosing,
    diff,
    status: isMatch ? "✓ 100% MATCH" : `MISMATCH (${diff.toLocaleString()})`
  });
}

// Print Client Table
console.log("-".repeat(130));
console.log(
  "CODE".padEnd(8) +
  "CLIENT NAME".padEnd(28) +
  "EXCEL OB".padStart(14) +
  "BILLED".padStart(15) +
  "RECEIVED".padStart(15) +
  "EXCEL NET".padStart(16) +
  "ERP NET".padStart(16) +
  "   AUDIT STATUS"
);
console.log("-".repeat(130));

for (const r of clientAuditResults) {
  console.log(
    (r.clientCode || "—").padEnd(8) +
    (r.name || r.sheetName || "").slice(0, 26).padEnd(28) +
    r.excelOB.toLocaleString().padStart(14) +
    r.excelBilled.toLocaleString().padStart(15) +
    r.excelReceived.toLocaleString().padStart(15) +
    r.excelClosing.toLocaleString().padStart(16) +
    (r.erpClosing !== null ? r.erpClosing.toLocaleString().padStart(16) : "—".padStart(16)) +
    `   ${r.status}`
  );
}

// ---------------------------------------------------------
// 2. AUDIT ALL 23 VENDORS
// ---------------------------------------------------------
const vendorWb = XLSX.readFile('./VENDOR BALANCE STATEMENTS .xlsx');
console.log(`\n\n>>> AUDITING VENDORS (${vendorWb.SheetNames.length} Excel Sheets vs ${REAL_VENDORS.length} ERP Vendors)...`);

let vendorPassCount = 0;
let vendorFailCount = 0;
const vendorAuditResults = [];

for (const sheetName of vendorWb.SheetNames) {
  const sheet = vendorWb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  let headerRowIdx = -1;
  let headers = [];

  for (let i = 0; i < Math.min(8, rows.length); i++) {
    const r = rows[i] || [];
    const rStr = r.filter(c => c !== null).map(c => String(c).trim().toLowerCase());
    if (rStr.some(c => c.includes('date') || c.includes('description') || c.includes('amount') || c.includes('paid') || c.includes('balance'))) {
      headerRowIdx = i;
      headers = r.map(c => c !== null ? String(c).trim() : '');
      break;
    }
  }

  let excelOB = 0;
  let excelBilled = 0;
  let excelPaid = 0;

  if (headerRowIdx !== -1) {
    let colDate = -1, colRef = -1, colDesc = -1, colAmount = -1, colPaid = -1, colBalance = -1;
    for (let c = 0; c < headers.length; c++) {
      const h = headers[c].toLowerCase();
      if (h.includes('date') && colDate === -1) colDate = c;
      else if ((h === 'p/r' || h === 'pr' || h === 'p / r' || h.includes('reference') || h.includes('ref') || h === 's.no' || h === 'sr' || h === 's/no.') && colRef === -1) colRef = c;
      else if (h.includes('description') || h.includes('particular')) colDesc = c;
      else if ((h === 'amount' || h.includes('bill') || h.includes('credit')) && colAmount === -1) colAmount = c;
      else if ((h.includes('paid') || h.includes('payment') || h.includes('debit') || h.includes('received') || h.includes('recevied')) && colPaid === -1) colPaid = c;
      else if (h.includes('balance') && colBalance === -1) colBalance = c;
    }

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.every(c => c === null || String(c).trim() === '')) continue;
      
      const rStr = r.filter(c => c !== null).map(c => String(c).trim().toUpperCase());
      if (rStr.some(s => s === 'TOTAL' || s === 'TOTAL AMOUNT' || s.includes('GRAND TOTAL') || s === 'TOTAL AMOUNT CASH')) {
        break; // Stop parsing right at TOTAL row to ignore trailing PO references
      }

      const desc = colDesc !== -1 && r[colDesc] !== null ? String(r[colDesc]).trim() : '';
      const ref = colRef !== -1 && r[colRef] !== null ? String(r[colRef]).trim() : '';
      const amt = colAmount !== -1 && r[colAmount] !== null && !isNaN(Number(r[colAmount])) ? Number(r[colAmount]) : 0;
      const paid = colPaid !== -1 && r[colPaid] !== null && !isNaN(Number(r[colPaid])) ? Number(r[colPaid]) : 0;
      const bal = colBalance !== -1 && r[colBalance] !== null && !isNaN(Number(r[colBalance])) ? Number(r[colBalance]) : null;

      if (desc.toUpperCase().includes('B/F') || ref.toUpperCase().includes('B/F') || desc.toUpperCase().includes('OPENING') || desc.toUpperCase().includes('BALANCE B/F')) {
        excelOB = bal !== null ? bal : (amt || 0);
        continue;
      }

      if (amt > 0) excelBilled += amt;
      if (paid > 0) excelPaid += paid;
    }
  }

  const excelClosing = excelOB + excelBilled - excelPaid;

  // Exact Match by sheetName
  const erpVendor = REAL_VENDORS.find(v => v.name.trim().toLowerCase() === sheetName.trim().toLowerCase());

  if (!erpVendor) {
    vendorFailCount++;
    vendorAuditResults.push({
      vendorCode: "—",
      name: sheetName,
      sheetName,
      excelOB,
      erpOB: 0,
      excelBilled,
      erpBilled: 0,
      excelPaid,
      erpPaid: 0,
      excelClosing,
      erpClosing: null,
      diff: excelClosing,
      status: "MISSING IN ERP"
    });
    continue;
  }

  const vendorExpenses = REAL_EXPENSES.filter(e => e.vendorId === erpVendor.id);
  const vendorVouchers = REAL_VOUCHERS.filter(v => v.vendorId === erpVendor.id);

  const erpBilled = vendorExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const erpPaid = vendorVouchers.filter(v => v.type === "PV").reduce((s, v) => s + (Number(v.amount) || 0), 0);
  const erpOB = Number(erpVendor.openingBalance) || 0;
  const erpClosing = erpOB + erpBilled - erpPaid;

  const diff = Math.abs(excelClosing - erpClosing);
  const isMatch = diff < 0.01;

  if (isMatch) vendorPassCount++;
  else vendorFailCount++;

  vendorAuditResults.push({
    vendorCode: erpVendor.vendorCode,
    name: erpVendor.name,
    sheetName,
    excelOB,
    erpOB,
    excelBilled,
    erpBilled,
    excelPaid,
    erpPaid,
    excelClosing,
    erpClosing,
    diff,
    status: isMatch ? "✓ 100% MATCH" : `MISMATCH (${diff.toLocaleString()})`
  });
}

// Print Vendor Table
console.log("-".repeat(130));
console.log(
  "CODE".padEnd(8) +
  "VENDOR NAME".padEnd(28) +
  "EXCEL OB".padStart(14) +
  "BILLS".padStart(15) +
  "PAID".padStart(15) +
  "EXCEL NET".padStart(16) +
  "ERP NET".padStart(16) +
  "   AUDIT STATUS"
);
console.log("-".repeat(130));

for (const r of vendorAuditResults) {
  console.log(
    (r.vendorCode || "—").padEnd(8) +
    (r.name || r.sheetName || "").slice(0, 26).padEnd(28) +
    r.excelOB.toLocaleString().padStart(14) +
    r.excelBilled.toLocaleString().padStart(15) +
    r.excelPaid.toLocaleString().padStart(15) +
    r.excelClosing.toLocaleString().padStart(16) +
    (r.erpClosing !== null ? r.erpClosing.toLocaleString().padStart(16) : "—".padStart(16)) +
    `   ${r.status}`
  );
}

// ---------------------------------------------------------
// 3. TRIAL BALANCE & DOUBLE-ENTRY GL AUDIT
// ---------------------------------------------------------
let totalDebits = 0;
let totalCredits = 0;

for (const entry of REAL_JOURNAL) {
  for (const line of entry.lines) {
    totalDebits += Number(line.debit || 0);
    totalCredits += Number(line.credit || 0);
  }
}

const glDiff = Math.abs(totalDebits - totalCredits);
const glBalanced = glDiff < 0.01;

console.log("\n" + "=".repeat(79));
console.log("                           FINAL AUDIT TEST RESULTS                            ");
console.log("=".repeat(79));
console.log(`Clients Audited : ${clientAuditResults.length} / ${clientWb.SheetNames.length}  | Passed: ${clientPassCount} (${((clientPassCount/clientAuditResults.length)*100).toFixed(1)}%) | Failed: ${clientFailCount}`);
console.log(`Vendors Audited : ${vendorAuditResults.length} / ${vendorWb.SheetNames.length}  | Passed: ${vendorPassCount} (${((vendorPassCount/vendorAuditResults.length)*100).toFixed(1)}%) | Failed: ${vendorFailCount}`);
console.log(`Trial Balance   : Debits = PKR ${totalDebits.toLocaleString()} | Credits = PKR ${totalCredits.toLocaleString()}`);
console.log(`GL Discrepancy  : PKR ${glDiff.toFixed(2)} (${glBalanced ? "100% PERFECT BALANCE" : "UNBALANCED"})`);
console.log("=".repeat(79) + "\n");
