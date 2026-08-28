import React, { useState, useMemo, useEffect, useRef } from "react";
import { Printer, Download, Filter, FileText, X, Building2, CheckCircle2, AlertCircle } from "lucide-react";

function amountInWords(num) {
  const n = Math.round(Math.abs(Number(num) || 0));
  if (n === 0) return "Zero Rupees Only";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const inWordsHelper = (val) => {
    if (val < 20) return a[val];
    const digit = val % 10;
    return b[Math.floor(val / 10)] + (digit ? " " + a[digit] : "");
  };
  let str = "";
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const rem = n % 100;
  if (crore) str += inWordsHelper(crore) + " Crore ";
  if (lakh) str += inWordsHelper(lakh) + " Lakh ";
  if (thousand) str += inWordsHelper(thousand) + " Thousand ";
  if (hundred) str += inWordsHelper(hundred) + " Hundred ";
  if (rem) str += inWordsHelper(rem) + " ";
  return (str.trim() + " Rupees Only");
}

function exportVendorStatementToExcel({ vendor, dateFrom, dateTo, statementData }) {
  const vName = vendor.companyName || vendor.name;
  const filename = `Vendor_Statement_${vName.replace(/[^a-zA-Z0-9]/g, "_")}_${dateFrom}_to_${dateTo}.xls`;

  let rowsHtml = `
    <tr>
      <td style="border: 1px solid #CBD5E1; padding: 6px; font-family: monospace; text-align: center;">${dateFrom}</td>
      <td style="border: 1px solid #CBD5E1; padding: 6px; font-family: monospace; font-weight: bold; text-align: center;">OB-000</td>
      <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">Opening Balance</td>
      <td style="border: 1px solid #CBD5E1; padding: 6px;">—</td>
      <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right;">—</td>
      <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right;">—</td>
      <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; mso-number-format:'\\#\\,\\#\\#0';">${statementData.openingPayable}</td>
    </tr>
  `;

  statementData.rows.forEach((r, idx) => {
    const bg = idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC";
    rowsHtml += `
      <tr style="background-color: ${bg};">
        <td style="border: 1px solid #CBD5E1; padding: 6px; font-family: monospace; text-align: center;">${r.date}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px; font-family: monospace; font-weight: bold; text-align: center;">${r.ref}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-weight: bold; color: ${r.type === 'Vendor Bill' ? '#D97706' : '#059669'};">${r.type}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px;">${r.project || 'General'}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; color: #059669; mso-number-format:'\\#\\,\\#\\#0';">${r.debit > 0 ? r.debit : '—'}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; color: #D97706; mso-number-format:'\\#\\,\\#\\#0';">${r.credit > 0 ? r.credit : '—'}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: ${r.runningBalance > 0 ? '#D97706' : '#059669'}; mso-number-format:'\\#\\,\\#\\#0';">${r.runningBalance}</td>
      </tr>
    `;
  });

  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Vendor Statement</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      <style>
        body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #0F172A; }
      </style>
    </head>
    <body>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td colspan="7" style="font-size: 16pt; font-weight: bold; color: #1E293B; padding-bottom: 4px;">AdPulse IMC (Private) Ltd</td>
        </tr>
        <tr>
          <td colspan="7" style="font-size: 12pt; font-weight: bold; color: #D97706; padding-bottom: 12px;">VENDOR STATEMENT / ACCOUNTS PAYABLE SUB-LEDGER</td>
        </tr>
        <tr style="background-color: #F8FAFC;">
          <td colspan="4" style="border: 1px solid #CBD5E1; padding: 6px;"><b>Vendor:</b> ${vName} (${vendor.vendorCode || vendor.id})</td>
          <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px;"><b>Statement Period:</b> ${dateFrom} to ${dateTo}</td>
        </tr>
        <tr style="background-color: #F8FAFC;">
          <td colspan="4" style="border: 1px solid #CBD5E1; padding: 6px;"><b>Contact:</b> ${vendor.contactPerson || 'N/A'} | ${vendor.phone || 'N/A'}</td>
          <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px;"><b>Bank:</b> ${vendor.bankName || 'N/A'} (${vendor.accountNumberIban || 'N/A'})</td>
        </tr>
        <tr><td colspan="7" style="height: 14px;"></td></tr>
        <tr style="background-color: #F1F5F9; font-weight: bold;">
          <td colspan="2" style="border: 1px solid #CBD5E1; padding: 8px; text-align: center;">Opening Payable: PKR ${statementData.openingPayable.toLocaleString()}</td>
          <td colspan="2" style="border: 1px solid #CBD5E1; padding: 8px; text-align: center; color: #D97706;">Total Bills (+): PKR ${statementData.totalExpenses.toLocaleString()}</td>
          <td colspan="2" style="border: 1px solid #CBD5E1; padding: 8px; text-align: center; color: #059669;">Total Payments (-): PKR ${statementData.totalPayments.toLocaleString()}</td>
          <td style="border: 1.5px solid #D97706; padding: 8px; text-align: center; background-color: #FEF3C7; color: #B45309;">Closing Payable: PKR ${statementData.closingPayable.toLocaleString()}</td>
        </tr>
        <tr><td colspan="7" style="height: 14px;"></td></tr>
        <tr style="background-color: #0F172A; color: #FFFFFF; font-weight: bold; text-align: center;">
          <th style="border: 1px solid #000; padding: 8px; width: 110px;">Date</th>
          <th style="border: 1px solid #000; padding: 8px; width: 110px;">Reference</th>
          <th style="border: 1px solid #000; padding: 8px; width: 130px;">Type</th>
          <th style="border: 1px solid #000; padding: 8px; width: 220px;">Project / Expense</th>
          <th style="border: 1px solid #000; padding: 8px; width: 140px; text-align: right;">Debit / Payment (PKR)</th>
          <th style="border: 1px solid #000; padding: 8px; width: 140px; text-align: right;">Credit / Bill (PKR)</th>
          <th style="border: 1px solid #000; padding: 8px; width: 150px; text-align: right;">Payable Balance (PKR)</th>
        </tr>
        ${rowsHtml}
        <tr style="background-color: #0F172A; color: #FFFFFF; font-weight: bold;">
          <td colspan="4" style="border: 1px solid #000; padding: 8px;">Closing Balance Summary</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #34D399; mso-number-format:'\\#\\,\\#\\#0';">${statementData.totalPayments}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #FBBF24; mso-number-format:'\\#\\,\\#\\#0';">${statementData.totalExpenses}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #FDE68A; font-size: 12pt; mso-number-format:'\\#\\,\\#\\#0';">${statementData.closingPayable}</td>
        </tr>
        <tr><td colspan="7" style="height: 18px;"></td></tr>
        <tr>
          <td colspan="7" style="font-size: 10pt; font-style: italic; color: #64748B;">Generated from AdPulse Financial Management System on ${new Date().toLocaleDateString()}</td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function VendorStatementPrintModal({ vendor, dateFrom, dateTo, statementData, onClose }) {
  const [pageSize, setPageSize] = useState("A4");
  const printRef = useRef(null);

  const pkr = (val) => "PKR " + (Number(val) || 0).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const handleExportPDF = () => {
    const printEl = printRef.current;
    if (!printEl) return;
    const vName = (vendor.companyName || vendor.name).replace(/[^a-zA-Z0-9]/g, "_");

    const triggerPdf = () => {
      if (window.html2pdf) {
        const opt = {
          margin: 8,
          filename: `Vendor_Statement_${vName}_${dateFrom}_to_${dateTo}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: (pageSize || "A4").toLowerCase(), orientation: "portrait" }
        };
        window.html2pdf().set(opt).from(printEl).save();
      } else {
        window.print();
      }
    };

    if (window.html2pdf) {
      triggerPdf();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = triggerPdf;
      script.onerror = () => window.print();
      document.head.appendChild(script);
    }
  };

  const handleExportExcel = () => {
    exportVendorStatementToExcel({ vendor, dateFrom, dateTo, statementData });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <style>{`
        @page { size: ${pageSize} portrait; margin: 8mm; }
        @media print {
          .no-print-header, .sidebar, .topbar, .btn, .mobile-toggle { display: none !important; }
          .modal-backdrop { background: none !important; padding: 0 !important; position: static !important; display: block !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; }
          .modal { box-shadow: none !important; border: none !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .print-area { padding: 0 !important; border: none !important; min-height: 880px !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; }
          .invoice-footer-banner { background: #A81C1C !important; background-image: linear-gradient(90deg, #A81C1C 0%, #1D3B4E 100%) !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; display: flex !important; margin-top: auto !important; }
        }
      `}</style>
      <div className="modal" style={{ width: 900, maxWidth: "98vw", maxHeight: "94vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        {/* MODAL TOP TOOLBAR */}
        <div className="no-print-header" style={{ marginBottom: 14, background: "#1E293B", padding: "12px 16px", borderRadius: 10, color: "#fff", border: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 13.5, color: "#F59E0B", display: "flex", alignItems: "center", gap: 5 }}>
              <FileText size={16} /> Vendor Statement Preview
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select value={pageSize} onChange={e => setPageSize(e.target.value)} style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 8, color: "#FFF", fontSize: 12.5, fontWeight: 700, padding: "5px 10px", cursor: "pointer" }}>
              <option value="A4" style={{ background: "#1E293B", color: "#FFFFFF" }}>A4 (210 x 297 mm)</option>
              <option value="Letter" style={{ background: "#1E293B", color: "#FFFFFF" }}>Letter (8.5 x 11 in)</option>
              <option value="Legal" style={{ background: "#1E293B", color: "#FFFFFF" }}>Legal (8.5 x 14 in)</option>
            </select>
            <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12.5, fontWeight: 700 }} onClick={handleExportPDF}>
              <Download size={14} /> Download PDF
            </button>
            <button className="btn" style={{ background: "#059669", color: "#FFFFFF", border: "none", padding: "6px 12px", fontSize: 12.5, fontWeight: 700 }} onClick={handleExportExcel}>
              <Download size={14} /> Download Excel
            </button>
            <button className="btn" style={{ background: "#475569", color: "#FFFFFF", border: "none", padding: "6px 12px", fontSize: 12.5, fontWeight: 700 }} onClick={() => window.print()}>
              <Printer size={14} /> Print
            </button>
            <button className="btn" style={{ background: "var(--rose)", color: "#fff", border: "none", padding: "5px 9px" }} onClick={onClose}><X size={15} /></button>
          </div>
        </div>

        {/* PRINTABLE AREA */}
        <div ref={printRef} className="print-area" style={{ background: "#ffffff", color: "#0F172A", borderRadius: 10, padding: "20px 24px", fontFamily: "'Calibri', 'Inter', sans-serif", minHeight: "880px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box" }}>
          <div>
            {/* TOP HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0F172A", paddingBottom: 10, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src="./logo.png" alt="AdPulse Logo" style={{ maxHeight: 46, width: "auto" }} onError={(e) => { e.target.style.display = 'none'; }} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px" }}>AdPulse IMC (Private) Ltd</div>
                  <div style={{ fontSize: 10.5, color: "#475569" }}>Financial Management &amp; Accounts Payable Sub-Ledger</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#D97706", textTransform: "uppercase" }}>VENDOR STATEMENT</div>
                <div className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: "#0F172A" }}>STMT-{(vendor.vendorCode || vendor.id || "").toUpperCase()}</div>
              </div>
            </div>

            {/* VENDOR & PERIOD INFO BOX */}
            <div style={{ background: "#F8FAFC", border: "1px solid #000000", borderRadius: 6, padding: "8px 12px", marginBottom: 12, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10, fontSize: 10.5 }}>
              <div>
                <div style={{ marginBottom: 3 }}><b>Vendor Account:</b> <span style={{ fontWeight: 700, fontSize: 11, color: "#0F172A" }}>{vendor.companyName || vendor.name}</span> <span style={{ color: "#64748B" }}>({vendor.vendorCode || vendor.id})</span></div>
                <div style={{ marginBottom: 3 }}><b>Contact Person:</b> {vendor.contactPerson || "N/A"} {vendor.phone ? `(${vendor.phone})` : ""}</div>
                <div><b>Bank &amp; Account:</b> {vendor.bankName || "N/A"} {vendor.accountNumberIban ? `· ${vendor.accountNumberIban}` : ""}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ marginBottom: 3 }}><b>Statement Period:</b> <span style={{ fontWeight: 700 }}>{dateFrom} to {dateTo}</span></div>
                <div style={{ marginBottom: 3 }}><b>Payment Terms:</b> {vendor.paymentTerms || "Net 15"}</div>
                <div><b>NTN / STRN:</b> {vendor.ntn || "N/A"} {vendor.strn ? `/ ${vendor.strn}` : ""}</div>
              </div>
            </div>

            {/* 4 SUMMARY METRIC CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
              <div style={{ background: "#FFFFFF", padding: "6px 10px", borderRadius: 5, border: "1px solid #000000", textAlign: "center" }}>
                <div style={{ fontSize: 8.5, color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>Opening Payable</div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "#1E293B", marginTop: 2 }}>{pkr(statementData.openingPayable)}</div>
              </div>
              <div style={{ background: "#FFFFFF", padding: "6px 10px", borderRadius: 5, border: "1px solid #000000", textAlign: "center" }}>
                <div style={{ fontSize: 8.5, color: "#D97706", fontWeight: 700, textTransform: "uppercase" }}>Total Bills / Exp (+)</div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "#D97706", marginTop: 2 }}>{pkr(statementData.totalExpenses)}</div>
              </div>
              <div style={{ background: "#FFFFFF", padding: "6px 10px", borderRadius: 5, border: "1px solid #000000", textAlign: "center" }}>
                <div style={{ fontSize: 8.5, color: "#059669", fontWeight: 700, textTransform: "uppercase" }}>Total Payments (-)</div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "#059669", marginTop: 2 }}>{pkr(statementData.totalPayments)}</div>
              </div>
              <div style={{ background: "#FEF3C7", padding: "6px 10px", borderRadius: 5, border: "1.5px solid #D97706", textAlign: "center" }}>
                <div style={{ fontSize: 8.5, color: "#B45309", fontWeight: 800, textTransform: "uppercase" }}>Closing Payable</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: "#B45309", marginTop: 2 }}>{pkr(statementData.closingPayable)}</div>
              </div>
            </div>

            {/* TRANSACTIONS TABLE - 7 STANDARD SUB-LEDGER COLUMNS */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12, fontSize: 9.5, tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "11%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "23%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "14%" }} />
              </colgroup>
              <thead>
                <tr style={{ background: "#F1F5F9", color: "#0F172A" }}>
                  <th style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "center", fontSize: 8.5, fontWeight: 800 }}>DATE</th>
                  <th style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "center", fontSize: 8.5, fontWeight: 800 }}>REF NO</th>
                  <th style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "center", fontSize: 8.5, fontWeight: 800 }}>TYPE</th>
                  <th style={{ border: "1px solid #000", padding: "5px 5px", textAlign: "left", fontSize: 8.5, fontWeight: 800 }}>PROJECT / EXPENSE</th>
                  <th style={{ border: "1px solid #000", padding: "4px 3px", textAlign: "right", fontSize: 8, fontWeight: 800, lineHeight: 1.15 }}>DEBIT / PAYMENT<br/>(PKR)</th>
                  <th style={{ border: "1px solid #000", padding: "4px 3px", textAlign: "right", fontSize: 8, fontWeight: 800, lineHeight: 1.15 }}>CREDIT / BILL<br/>(PKR)</th>
                  <th style={{ border: "1px solid #000", padding: "4px 3px", textAlign: "right", fontSize: 8, fontWeight: 800, lineHeight: 1.15 }}>PAYABLE BALANCE<br/>(PKR)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: "#F8FAFC", fontWeight: 600 }}>
                  <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "center" }}>{dateFrom}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "center", fontWeight: 700, fontFamily: "monospace" }}>OB-000</td>
                  <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "center" }}>Opening Balance</td>
                  <td style={{ border: "1px solid #000", padding: "5px 5px" }}>—</td>
                  <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "right" }}>—</td>
                  <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "right" }}>—</td>
                  <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "right", fontWeight: 800 }}>{pkr(statementData.openingPayable)}</td>
                </tr>

                {statementData.rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ border: "1px solid #000", textAlign: "center", padding: 14, color: "#64748B" }}>
                      No vendor transactions recorded within this statement period.
                    </td>
                  </tr>
                ) : (
                  statementData.rows.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "center", fontSize: 9 }}>{row.date}</td>
                      <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "center", fontWeight: 700, fontFamily: "monospace", fontSize: 8.8, whiteSpace: "nowrap" }}>{row.ref}</td>
                      <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "center", fontWeight: 600, fontSize: 8.8, color: row.type === "Vendor Bill" ? "#D97706" : "#059669" }}>
                        {row.type}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "5px 5px", wordBreak: "break-word", fontSize: 9 }}>{row.project}</td>
                      <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "right", color: row.debit > 0 ? "#059669" : "inherit", fontSize: 9, fontWeight: row.debit > 0 ? 700 : 400 }}>
                        {row.debit > 0 ? pkr(row.debit) : "—"}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "right", color: row.credit > 0 ? "#D97706" : "inherit", fontSize: 9, fontWeight: row.credit > 0 ? 700 : 400 }}>
                        {row.credit > 0 ? pkr(row.credit) : "—"}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "right", fontWeight: 800, color: row.runningBalance > 0 ? "#D97706" : "#059669", fontSize: 9.2 }}>
                        {pkr(row.runningBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: "#F1F5F9", fontWeight: 800 }}>
                  <td colSpan={4} style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "right", fontSize: 9 }}>Closing Balance Summary</td>
                  <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "right", color: "#059669", fontSize: 9 }}>{pkr(statementData.totalPayments)}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "right", color: "#D97706", fontSize: 9 }}>{pkr(statementData.totalExpenses)}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "right", color: "#B45309", fontSize: 9.5 }}>{pkr(statementData.closingPayable)}</td>
                </tr>
              </tfoot>
            </table>

            {/* AMOUNT IN WORDS */}
            <div style={{ fontSize: 9.5, fontStyle: "italic", color: "#334155", marginBottom: 12, background: "#F8FAFC", padding: "5px 8px", borderRadius: 4, border: "1px solid #000" }}>
              Closing Payable Balance in words: <b style={{ color: "#0F172A", fontStyle: "normal" }}>{amountInWords(statementData.closingPayable)}</b>
            </div>
          </div>

          {/* BOTTOM PINNED: SIGNATURES & FOOTER */}
          <div style={{ marginTop: "auto", paddingTop: 14 }}>
            {/* SIGNATURES - CLEANLY ALIGNED WITH PROPER SPACING */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10, fontSize: 9.5, fontWeight: 700 }}>
              <div style={{ textAlign: "center", width: 190 }}>
                <div style={{ borderTop: "1.5px solid #000000", paddingTop: 4, letterSpacing: "0.3px" }}>PREPARED BY</div>
              </div>
              <div style={{ textAlign: "center", width: 190 }}>
                <div style={{ borderTop: "1.5px solid #000000", paddingTop: 4, letterSpacing: "0.3px" }}>ACCOUNTS MANAGER</div>
              </div>
              <div style={{ textAlign: "center", width: 190 }}>
                <div style={{ borderTop: "1.5px solid #000000", paddingTop: 4, letterSpacing: "0.3px" }}>AUTHORIZED SIGNATORY</div>
              </div>
            </div>

            {/* FOOTER BANNER */}
            <div className="invoice-footer-banner" style={{ background: "#A81C1C", backgroundImage: "linear-gradient(90deg, #A81C1C 0%, #1D3B4E 100%)", color: "#FFFFFF", padding: "5px 12px", borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 8.8, fontWeight: 600, boxSizing: "border-box" }}>
              <div>📞 +92 21 37526834</div>
              <div>✉️ communication@adpulse.pk | 🌐 www.adpulse.pk</div>
              <div>📍 Office # 213, 2nd Floor, Park Tower, Block 5 Clifton, Karachi.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VendorStatementView({
  vendors = [],
  projects = [],
  expenses = [],
  vouchers = [],
  journal = [],
  selectedVendorId,
  onSelectVendor
}) {
  const [activeVendorId, setActiveVendorId] = useState(selectedVendorId || (vendors[0]?.id || ""));
  const [dateFrom, setDateFrom] = useState("2026-07-01");
  const [dateTo, setDateTo] = useState("2026-08-31");
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    if (selectedVendorId) {
      setActiveVendorId(selectedVendorId);
    }
  }, [selectedVendorId]);

  const selectedVendor = useMemo(() => {
    if (!vendors || vendors.length === 0) return null;
    return vendors.find(v => v.id === activeVendorId || v.vendorCode === activeVendorId) || vendors[0] || null;
  }, [vendors, activeVendorId]);

  // Compute transactions & opening balance from posted entries
  const statementData = useMemo(() => {
    if (!selectedVendor) {
      return { openingPayable: 0, rows: [], totalExpenses: 0, totalPayments: 0, closingPayable: 0 };
    }

    const vendorNameNorm = (selectedVendor.name || "").toLowerCase();

    const isVendorMatch = (item) => {
      if (!item || !selectedVendor) return false;
      if (item.vendorId === selectedVendor.id) return true;
      if (item.vendor && item.vendor.toLowerCase().includes(vendorNameNorm)) return true;
      if (item.party && item.party.toLowerCase().includes(vendorNameNorm)) return true;
      return false;
    };

    const isProjectMatch = (item) => {
      if (selectedProjectId === "all") return true;
      return item.projectId === selectedProjectId;
    };

    // 1. Calculate Opening Payable prior to dateFrom
    let opening = Number(selectedVendor.openingBalance) || 0;

    // Prior Expenses (Bills/Credits)
    expenses.filter(e => isVendorMatch(e) && isProjectMatch(e) && e.date < dateFrom).forEach(exp => {
      opening += Number(exp.amount) || 0;
    });

    // Prior Payments (Debits)
    vouchers.filter(v => isVendorMatch(v) && isProjectMatch(v) && v.date < dateFrom && v.type === "PV").forEach(v => {
      opening -= Number(v.amount) || 0;
    });

    // 2. Filter Statement Rows within date range
    const rawRows = [];

    expenses.filter(e => isVendorMatch(e) && isProjectMatch(e) && e.date >= dateFrom && e.date <= dateTo).forEach(exp => {
      const proj = projects.find(p => p.id === exp.projectId);
      rawRows.push({
        id: exp.id,
        date: exp.date,
        ref: exp.expenseNo || ("EXP-" + exp.id.toUpperCase()),
        type: "Vendor Bill",
        project: proj ? proj.name : (exp.category || "Operating Expense"),
        debit: 0,
        credit: Number(exp.amount) || 0,
        status: exp.status === "paid" ? "Paid" : "Unpaid AP",
        raw: exp
      });
    });

    vouchers.filter(v => isVendorMatch(v) && isProjectMatch(v) && v.date >= dateFrom && v.date <= dateTo && v.type === "PV").forEach(v => {
      const proj = projects.find(p => p.id === v.projectId);
      rawRows.push({
        id: v.id,
        date: v.date,
        ref: v.voucherNo || ("PV-" + v.id.toUpperCase()),
        type: "Vendor Payment",
        project: proj ? proj.name : (v.description || "Vendor Payment"),
        debit: Number(v.amount) || 0,
        credit: 0,
        status: v.status || "Posted",
        raw: v
      });
    });

    rawRows.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Accounts Payable Sign Convention: Balance = Opening + Credits - Debits
    let running = opening;
    let totalExpenses = 0;
    let totalPayments = 0;

    const rowsWithBalance = rawRows.map(r => {
      running = running + r.credit - r.debit;
      totalExpenses += r.credit;
      totalPayments += r.debit;
      return { ...r, runningBalance: running };
    });

    return {
      openingPayable: opening,
      rows: rowsWithBalance,
      totalExpenses,
      totalPayments,
      closingPayable: running
    };
  }, [selectedVendor, selectedProjectId, dateFrom, dateTo, expenses, vouchers, projects]);

  const pkr = (val) => "PKR " + (Number(val) || 0).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const handleExportExcel = () => {
    if (!selectedVendor) return;
    exportVendorStatementToExcel({ vendor: selectedVendor, dateFrom, dateTo, statementData });
  };

  return (
    <div style={{ padding: 20 }}>
      {/* FILTER TOP BAR */}
      <div className="card" style={{ padding: 16, marginBottom: 20, background: "var(--card-bg)", borderRadius: 12, border: "1px solid var(--rule)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, marginBottom: 14, color: "var(--ink)" }}>
          <Filter size={18} color="#D97706" /> Vendor Ledger / Statement Filters
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label className="form-label">Select Vendor *</label>
            <select className="form-select" value={activeVendorId} onChange={e => { setActiveVendorId(e.target.value); if (onSelectVendor) onSelectVendor(e.target.value); }}>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>
                  {v.vendorCode || v.id} — {v.name} ({v.companyName || "No Company"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Date From</label>
            <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>

          <div>
            <label className="form-label">Date To</label>
            <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>

          <div>
            <label className="form-label">Project Filter</label>
            <select className="form-select" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14, borderTop: "1px solid var(--rule)", paddingTop: 10 }}>
          <button className="btn" onClick={handleExportExcel} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "#059669", borderColor: "#059669", color: "#FFFFFF" }}>
            <Download size={15} /> Export Excel
          </button>
          <button className="btn btn-primary" onClick={() => setShowPrintModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "#D97706", borderColor: "#D97706" }}>
            <Printer size={15} /> Print / Save PDF Statement
          </button>
        </div>
      </div>

      {selectedVendor ? (
        <div id="printable-vendor-statement">
          {/* STATEMENT HEADER */}
          <div className="card" style={{ padding: 20, marginBottom: 20, borderRadius: 12, border: "1.5px solid #D97706", background: "linear-gradient(135deg, rgba(217, 119, 6, 0.04) 0%, rgba(217, 119, 6, 0.01) 100%)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ background: "#D97706", color: "#FFFFFF", padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>VENDOR STATEMENT</span>
                <h2 style={{ margin: "8px 0 2px 0", fontSize: 22 }}>{selectedVendor.companyName || selectedVendor.name}</h2>
                <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                  Vendor ID: <strong>{selectedVendor.vendorCode || selectedVendor.id}</strong> &middot; Contact: {selectedVendor.contactPerson || "N/A"} ({selectedVendor.phone || "N/A"})
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>
                  Bank: {selectedVendor.bankName || "N/A"} | Account: {selectedVendor.accountNumberIban || "N/A"}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>Statement Period</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{dateFrom} to {dateTo}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-muted)" }}>Payment Terms: <strong>{selectedVendor.paymentTerms || "Net 30"}</strong></div>
              </div>
            </div>

            {/* STATEMENT SUMMARY CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20 }}>
              <div style={{ background: "var(--bg)", padding: 14, borderRadius: 8, border: "1px solid var(--rule)" }}>
                <div style={{ fontSize: 12, color: "var(--ink-muted)", fontWeight: 600 }}>Opening Payable</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", marginTop: 4 }}>{pkr(statementData.openingPayable)}</div>
              </div>

              <div style={{ background: "var(--bg)", padding: 14, borderRadius: 8, border: "1px solid var(--rule)" }}>
                <div style={{ fontSize: 12, color: "var(--ink-muted)", fontWeight: 600 }}>Total Bills / Expenses (+)</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#D97706", marginTop: 4 }}>{pkr(statementData.totalExpenses)}</div>
              </div>

              <div style={{ background: "var(--bg)", padding: 14, borderRadius: 8, border: "1px solid var(--rule)" }}>
                <div style={{ fontSize: 12, color: "var(--ink-muted)", fontWeight: 600 }}>Total Payments (-)</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#059669", marginTop: 4 }}>{pkr(statementData.totalPayments)}</div>
              </div>

              <div style={{ background: "rgba(217, 119, 6, 0.08)", padding: 14, borderRadius: 8, border: "1.5px solid #D97706" }}>
                <div style={{ fontSize: 12, color: "#B45309", fontWeight: 700 }}>Closing Payable Balance</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: "#D97706", marginTop: 4 }}>{pkr(statementData.closingPayable)}</div>
              </div>
            </div>
          </div>

          {/* STATEMENT TABLE */}
          <div className="card" style={{ padding: 0, borderRadius: 10, overflow: "hidden", border: "1px solid var(--rule)" }}>
            <div style={{ padding: "12px 16px", background: "var(--table-header-bg)", borderBottom: "1px solid var(--rule)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ margin: 0, fontSize: 14 }}>Accounts Payable Sub-Ledger Activity</h4>
              <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{statementData.rows.length} Transactions</span>
            </div>

            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Project / Expense</th>
                  <th style={{ textAlign: "right" }}>Debit / Payment (PKR)</th>
                  <th style={{ textAlign: "right" }}>Credit / Bill (PKR)</th>
                  <th style={{ textAlign: "right" }}>Payable Balance (PKR)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: "var(--bg)", fontWeight: 600 }}>
                  <td>{dateFrom}</td>
                  <td>OB-000</td>
                  <td>Opening Balance</td>
                  <td>—</td>
                  <td style={{ textAlign: "right" }}>—</td>
                  <td style={{ textAlign: "right" }}>—</td>
                  <td style={{ textAlign: "right", fontWeight: 800 }}>{pkr(statementData.openingPayable)}</td>
                </tr>

                {statementData.rows.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: 30, color: "var(--ink-muted)" }}>
                      No vendor transactions recorded within this date range.
                    </td>
                  </tr>
                ) : (
                  statementData.rows.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.date}</td>
                      <td><span style={{ fontFamily: "monospace", fontWeight: 700 }}>{row.ref}</span></td>
                      <td>
                        <span style={{
                          padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                          background: row.type === "Vendor Bill" ? "rgba(217, 119, 6, 0.1)" : "rgba(5, 150, 105, 0.1)",
                          color: row.type === "Vendor Bill" ? "#D97706" : "#059669"
                        }}>
                          {row.type}
                        </span>
                      </td>
                      <td>{row.project}</td>
                      <td style={{ textAlign: "right", color: row.debit > 0 ? "#059669" : "inherit", fontWeight: row.debit > 0 ? 700 : 400 }}>
                        {row.debit > 0 ? pkr(row.debit) : "—"}
                      </td>
                      <td style={{ textAlign: "right", color: row.credit > 0 ? "#D97706" : "inherit", fontWeight: row.credit > 0 ? 700 : 400 }}>
                        {row.credit > 0 ? pkr(row.credit) : "—"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 800, color: row.runningBalance > 0 ? "#D97706" : "#059669" }}>
                        {pkr(row.runningBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: "var(--table-header-bg)", fontWeight: 800 }}>
                  <td colSpan="4">Closing Payable Balance</td>
                  <td style={{ textAlign: "right", color: "#059669" }}>{pkr(statementData.totalPayments)}</td>
                  <td style={{ textAlign: "right", color: "#D97706" }}>{pkr(statementData.totalExpenses)}</td>
                  <td style={{ textAlign: "right", fontSize: 15, color: "#D97706" }}>{pkr(statementData.closingPayable)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: 40, color: "var(--ink-muted)" }}>
          No vendor selected. Please register or select a vendor above.
        </div>
      )}

      {/* RENDER DEDICATED PRINT/PDF MODAL */}
      {showPrintModal && selectedVendor && (
        <VendorStatementPrintModal
          vendor={selectedVendor}
          dateFrom={dateFrom}
          dateTo={dateTo}
          statementData={statementData}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
