import XLSX from 'xlsx';
import fs from 'fs';

function excelDateToISODate(serial) {
  if (!serial) return null;
  if (typeof serial === 'string') {
    const parsed = Date.parse(serial);
    if (!isNaN(parsed)) {
      return new Date(parsed).toISOString().slice(0, 10);
    }
    return serial;
  }
  if (typeof serial === 'number') {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().slice(0, 10);
  }
  return null;
}

console.log("=== COMPREHENSIVE VENDOR WORKBOOK ANALYSIS ===");
const vendorWb = XLSX.readFile('./VENDOR BALANCE STATEMENTS .xlsx');

const vendorReports = [];

for (const sheetName of vendorWb.SheetNames) {
  const sheet = vendorWb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  
  let headerRowIdx = -1;
  let headers = [];
  let title = sheetName;

  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const r = rows[i] || [];
    const rStr = r.filter(c => c !== null).map(c => String(c).trim().toLowerCase());
    
    const nonNulls = r.filter(c => c !== null && String(c).trim().length > 0);
    if (nonNulls.length === 1 && headerRowIdx === -1 && i < 3) {
      title = String(nonNulls[0]).trim();
    }

    if (rStr.some(c => c.includes('date') || c.includes('description') || c.includes('amount') || c.includes('paid') || c.includes('balance'))) {
      headerRowIdx = i;
      headers = r.map(c => c !== null ? String(c).trim() : '');
      break;
    }
  }

  const txns = [];
  let openingBalance = 0;
  let totalBilled = 0;
  let totalPaid = 0;
  let calculatedClosingBalance = 0;

  if (headerRowIdx !== -1) {
    let colDate = -1, colRef = -1, colDesc = -1, colAmount = -1, colPaid = -1, colBalance = -1, colNotes = -1;
    for (let c = 0; c < headers.length; c++) {
      const h = headers[c].toLowerCase();
      if (h.includes('date') && colDate === -1) colDate = c;
      else if ((h === 'p/r' || h === 'pr' || h === 'p / r' || h.includes('reference') || h.includes('ref') || h === 'invoice #') && colRef === -1) colRef = c;
      else if (h.includes('description') || h.includes('particular')) colDesc = c;
      else if ((h === 'amount' || h.includes('bill') || h.includes('credit')) && colAmount === -1) colAmount = c;
      else if ((h.includes('paid') || h.includes('payment') || h.includes('debit')) && colPaid === -1) colPaid = c;
      else if (h.includes('balance') && colBalance === -1) colBalance = c;
      else if (h.includes('status') || h.includes('bank') || h.includes('remarks') || h.includes('notes')) colNotes = c;
    }

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.every(c => c === null || String(c).trim() === '')) continue;
      
      const desc = colDesc !== -1 && r[colDesc] !== null ? String(r[colDesc]).trim() : '';
      const ref = colRef !== -1 && r[colRef] !== null ? String(r[colRef]).trim() : '';
      const rawDate = colDate !== -1 ? r[colDate] : null;
      const amt = colAmount !== -1 && r[colAmount] !== null && !isNaN(Number(r[colAmount])) ? Number(r[colAmount]) : 0;
      const paid = colPaid !== -1 && r[colPaid] !== null && !isNaN(Number(r[colPaid])) ? Number(r[colPaid]) : 0;
      const bal = colBalance !== -1 && r[colBalance] !== null && !isNaN(Number(r[colBalance])) ? Number(r[colBalance]) : null;
      const notes = colNotes !== -1 && r[colNotes] !== null ? String(r[colNotes]).trim() : '';

      const rStr = r.filter(c => c !== null).map(c => String(c).trim().toUpperCase());
      if (rStr.some(s => s === 'TOTAL' || s === 'TOTAL AMOUNT' || s.includes('GRAND TOTAL'))) {
        continue;
      }

      if (desc.toUpperCase().includes('B/F') || desc.toUpperCase().includes('OPENING') || desc.toUpperCase().includes('BALANCE B/F')) {
        const obVal = bal !== null ? bal : (amt || 0);
        openingBalance = obVal;
        calculatedClosingBalance = obVal;
        txns.push({
          type: 'OB',
          date: excelDateToISODate(rawDate) || '2026-06-30',
          ref: ref || 'OB-000',
          desc: desc || 'B/F BALANCE',
          amount: 0,
          paid: 0,
          balance: obVal,
          notes
        });
        continue;
      }

      if (amt === 0 && paid === 0 && (!desc || desc === '0')) continue;

      if (amt > 0) totalBilled += amt;
      if (paid > 0) totalPaid += paid;
      calculatedClosingBalance += amt - paid;

      txns.push({
        type: amt > 0 ? 'BILL' : 'PAYMENT',
        date: excelDateToISODate(rawDate) || '2026-07-01',
        ref: ref || (amt > 0 ? 'BILL' : 'PAY'),
        desc: desc || (amt > 0 ? 'Vendor Bill' : 'Payment Paid'),
        amount: amt,
        paid: paid,
        balance: bal !== null ? bal : calculatedClosingBalance,
        notes
      });
    }
  }

  vendorReports.push({
    sheetName,
    title,
    headerRowIdx,
    headers: headers.filter(Boolean),
    openingBalance,
    totalBilled,
    totalPaid,
    calculatedClosingBalance,
    txnsCount: txns.length,
    txns: txns
  });
}

console.log(`Found ${vendorReports.length} Vendor Sheets.`);
for (const vr of vendorReports) {
  console.log(`Vendor [${vr.sheetName}] -> Title: "${vr.title}" | OB: ${vr.openingBalance} | Bills: ${vr.totalBilled} | Paid: ${vr.totalPaid} | Closing: ${vr.calculatedClosingBalance} (Txns: ${vr.txnsCount})`);
  if (vr.sheetName.includes('Zaib') || vr.sheetName.includes('AA ADVERTISING')) {
    console.log("Details:", JSON.stringify(vr.txns, null, 2));
  }
}

fs.writeFileSync('./scripts/vendor_analysis.json', JSON.stringify(vendorReports, null, 2));
