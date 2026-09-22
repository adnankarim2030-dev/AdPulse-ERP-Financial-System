import XLSX from 'xlsx';
import fs from 'fs';

function excelDateToISODate(serial) {
  if (!serial) return null;
  if (typeof serial === 'string') {
    // Check if it's already a date string like "30-Jun-26" or "2026-07-01"
    const parsed = Date.parse(serial);
    if (!isNaN(parsed)) {
      return new Date(parsed).toISOString().slice(0, 10);
    }
    return serial;
  }
  if (typeof serial === 'number') {
    // Excel base date: Dec 30 1899
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().slice(0, 10);
  }
  return null;
}

console.log("=== COMPREHENSIVE CLIENT WORKBOOK ANALYSIS ===");
const clientWb = XLSX.readFile('./CLIENT BALANCE PAYMENT AND LEDGERS  (1).xlsx');

const clientReports = [];

for (const sheetName of clientWb.SheetNames) {
  const sheet = clientWb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  
  // Find party title and header row
  let headerRowIdx = -1;
  let headers = [];
  let title = sheetName;

  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const r = rows[i] || [];
    const rStr = r.filter(c => c !== null).map(c => String(c).trim().toLowerCase());
    
    // Look for client title in top rows
    const nonNulls = r.filter(c => c !== null && String(c).trim().length > 0);
    if (nonNulls.length === 1 && headerRowIdx === -1 && i < 3) {
      title = String(nonNulls[0]).trim();
    }

    if (rStr.some(c => c.includes('date') || c.includes('description') || c.includes('amount') || c.includes('recevied') || c.includes('received') || c.includes('balance'))) {
      headerRowIdx = i;
      headers = r.map(c => c !== null ? String(c).trim() : '');
      break;
    }
  }

  const txns = [];
  let openingBalance = 0;
  let totalBilled = 0;
  let totalReceived = 0;
  let calculatedClosingBalance = 0;

  if (headerRowIdx !== -1) {
    // find column indexes
    let colDate = -1, colRef = -1, colDesc = -1, colAmount = -1, colReceived = -1, colBalance = -1;
    for (let c = 0; c < headers.length; c++) {
      const h = headers[c].toLowerCase();
      if (h.includes('date') && colDate === -1) colDate = c;
      else if ((h === 'p/r' || h === 'pr' || h.includes('reference') || h.includes('ref') || h === 'invoice #') && colRef === -1) colRef = c;
      else if (h.includes('description') || h.includes('particular')) colDesc = c;
      else if ((h === 'amount' || h.includes('billed') || h.includes('debit')) && colAmount === -1) colAmount = c;
      else if ((h.includes('recevied') || h.includes('received') || h.includes('paid') || h.includes('credit')) && colReceived === -1) colReceived = c;
      else if (h.includes('balance') && colBalance === -1) colBalance = c;
    }

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.every(c => c === null || String(c).trim() === '')) continue;
      
      const desc = colDesc !== -1 && r[colDesc] !== null ? String(r[colDesc]).trim() : '';
      const ref = colRef !== -1 && r[colRef] !== null ? String(r[colRef]).trim() : '';
      const rawDate = colDate !== -1 ? r[colDate] : null;
      const amt = colAmount !== -1 && r[colAmount] !== null && !isNaN(Number(r[colAmount])) ? Number(r[colAmount]) : 0;
      const rec = colReceived !== -1 && r[colReceived] !== null && !isNaN(Number(r[colReceived])) ? Number(r[colReceived]) : 0;
      const bal = colBalance !== -1 && r[colBalance] !== null && !isNaN(Number(r[colBalance])) ? Number(r[colBalance]) : null;

      // check if summary row (TOTAL)
      const rStr = r.filter(c => c !== null).map(c => String(c).trim().toUpperCase());
      if (rStr.some(s => s === 'TOTAL' || s === 'TOTAL AMOUNT' || s.includes('GRAND TOTAL'))) {
        continue;
      }

      // Check if B/F opening balance
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
          received: 0,
          balance: obVal
        });
        continue;
      }

      if (amt === 0 && rec === 0 && (!desc || desc === '0')) continue;

      if (amt > 0) totalBilled += amt;
      if (rec > 0) totalReceived += rec;
      calculatedClosingBalance += amt - rec;

      txns.push({
        type: amt > 0 ? 'BILLING' : 'RECEIPT',
        date: excelDateToISODate(rawDate) || '2026-07-01',
        ref: ref || (amt > 0 ? 'INV' : 'REC'),
        desc: desc || (amt > 0 ? 'Media Campaign Billed' : 'Payment Received'),
        amount: amt,
        received: rec,
        balance: bal !== null ? bal : calculatedClosingBalance
      });
    }
  }

  clientReports.push({
    sheetName,
    title,
    headerRowIdx,
    headers: headers.filter(Boolean),
    openingBalance,
    totalBilled,
    totalReceived,
    calculatedClosingBalance,
    txnsCount: txns.length,
    txns: txns
  });
}

console.log(`Found ${clientReports.length} Client Sheets.`);
for (const cr of clientReports) {
  console.log(`Client [${cr.sheetName}] -> Title: "${cr.title}" | OB: ${cr.openingBalance} | Billed: ${cr.totalBilled} | Received: ${cr.totalReceived} | Closing: ${cr.calculatedClosingBalance} (Txns: ${cr.txnsCount})`);
  if (cr.sheetName === 'DEBS' || cr.sheetName.includes('NAJEEB') || cr.sheetName.includes('CHASE')) {
    console.log("Details:", JSON.stringify(cr.txns, null, 2));
  }
}

fs.writeFileSync('./scripts/client_analysis.json', JSON.stringify(clientReports, null, 2));
