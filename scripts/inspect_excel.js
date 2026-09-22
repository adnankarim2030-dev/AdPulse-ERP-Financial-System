import XLSX from 'xlsx';
import fs from 'fs';

console.log("=== INSPECTING CLIENT WORKBOOK ===");
const clientWb = XLSX.readFile('./CLIENT BALANCE PAYMENT AND LEDGERS  (1).xlsx');
console.log("Client Sheets:", clientWb.SheetNames);

for (const name of clientWb.SheetNames) {
  const sheet = clientWb.Sheets[name];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`\n--- Sheet: ${name} (Rows: ${data.length}) ---`);
  // print first 10 rows
  for (let i = 0; i < Math.min(12, data.length); i++) {
    console.log(`Row ${i}:`, JSON.stringify(data[i]));
  }
}

console.log("\n=== INSPECTING VENDOR WORKBOOK ===");
const vendorWb = XLSX.readFile('./VENDOR BALANCE STATEMENTS .xlsx');
console.log("Vendor Sheets:", vendorWb.SheetNames);

for (const name of vendorWb.SheetNames) {
  const sheet = vendorWb.Sheets[name];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`\n--- Sheet: ${name} (Rows: ${data.length}) ---`);
  for (let i = 0; i < Math.min(12, data.length); i++) {
    console.log(`Row ${i}:`, JSON.stringify(data[i]));
  }
}
