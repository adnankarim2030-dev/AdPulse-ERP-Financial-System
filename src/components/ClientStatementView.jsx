import React, { useState, useMemo, useEffect, useRef } from "react";
import { Printer, Download, Filter, FileText, Calendar, Building2, CheckCircle2, AlertCircle, Search, X } from "lucide-react";
import { cleanInvoiceNo } from "../App.jsx";

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

function exportClientStatementToExcel({ client, dateFrom, dateTo, statementData }) {
  const cName = client.companyName || client.name;
  const filename = `Client_Statement_${cName.replace(/[^a-zA-Z0-9]/g, "_")}_${dateFrom}_to_${dateTo}.xls`;

  let rowsHtml = `
    <tr>
      <td style="border: 1px solid #CBD5E1; padding: 6px; font-family: monospace; text-align: center;">${dateFrom}</td>
      <td style="border: 1px solid #CBD5E1; padding: 6px; font-family: monospace; font-weight: bold; text-align: center;">OB-000</td>
      <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">Opening Balance</td>
      <td style="border: 1px solid #CBD5E1; padding: 6px;">—</td>
      <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right;">—</td>
      <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right;">—</td>
      <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; mso-number-format:'\\#\\,\\#\\#0';">${statementData.openingBalance}</td>
    </tr>
  `;

  statementData.rows.forEach((r, idx) => {
    const bg = idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC";
    rowsHtml += `
      <tr style="background-color: ${bg};">
        <td style="border: 1px solid #CBD5E1; padding: 6px; font-family: monospace; text-align: center;">${r.date}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px; font-family: monospace; font-weight: bold; text-align: center;">${r.ref}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-weight: bold; color: ${r.type === 'Invoice' ? '#0284C7' : '#059669'};">${r.type}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px;">${r.project || 'General'}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; color: #0284C7; mso-number-format:'\\#\\,\\#\\#0';">${r.debit > 0 ? r.debit : '—'}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; color: #059669; mso-number-format:'\\#\\,\\#\\#0';">${r.credit > 0 ? r.credit : '—'}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: ${r.runningBalance > 0 ? '#0284C7' : '#059669'}; mso-number-format:'\\#\\,\\#\\#0';">${r.runningBalance}</td>
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
              <x:Name>Client Statement</x:Name>
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
          <td colspan="7" style="font-size: 12pt; font-weight: bold; color: #0284C7; padding-bottom: 12px;">CLIENT STATEMENT / ACCOUNTS RECEIVABLE SUB-LEDGER</td>
        </tr>
        <tr style="background-color: #F8FAFC;">
          <td colspan="4" style="border: 1px solid #CBD5E1; padding: 6px;"><b>Client:</b> ${cName} (${client.clientCode || client.id})</td>
          <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px;"><b>Statement Period:</b> ${dateFrom} to ${dateTo}</td>
        </tr>
        <tr style="background-color: #F8FAFC;">
          <td colspan="4" style="border: 1px solid #CBD5E1; padding: 6px;"><b>Contact:</b> ${client.contactPerson || 'N/A'} | ${client.phone || 'N/A'}</td>
          <td colspan="3" style="border: 1px solid #CBD5E1; padding: 6px;"><b>Address:</b> ${client.address || 'Karachi, Pakistan'}</td>
        </tr>
        <tr><td colspan="7" style="height: 14px;"></td></tr>
        <tr style="background-color: #F1F5F9; font-weight: bold;">
          <td colspan="2" style="border: 1px solid #CBD5E1; padding: 8px; text-align: center;">Opening Balance: PKR ${statementData.openingBalance.toLocaleString()}</td>
          <td colspan="2" style="border: 1px solid #CBD5E1; padding: 8px; text-align: center; color: #0284C7;">Total Invoiced (+): PKR ${statementData.totalInvoiced.toLocaleString()}</td>
          <td colspan="2" style="border: 1px solid #CBD5E1; padding: 8px; text-align: center; color: #059669;">Total Received (-): PKR ${statementData.totalReceived.toLocaleString()}</td>
          <td style="border: 1.5px solid #0284C7; padding: 8px; text-align: center; background-color: #E0F2FE; color: #0369A1;">Closing Outstanding: PKR ${statementData.closingBalance.toLocaleString()}</td>
        </tr>
        <tr><td colspan="7" style="height: 14px;"></td></tr>
        <tr style="background-color: #0F172A; color: #FFFFFF; font-weight: bold; text-align: center;">
          <th style="border: 1px solid #000; padding: 8px; width: 110px;">Date</th>
          <th style="border: 1px solid #000; padding: 8px; width: 110px;">Reference</th>
          <th style="border: 1px solid #000; padding: 8px; width: 130px;">Type</th>
          <th style="border: 1px solid #000; padding: 8px; width: 220px;">Project / Scope</th>
          <th style="border: 1px solid #000; padding: 8px; width: 140px; text-align: right;">Debit / Invoiced (PKR)</th>
          <th style="border: 1px solid #000; padding: 8px; width: 140px; text-align: right;">Credit / Received (PKR)</th>
          <th style="border: 1px solid #000; padding: 8px; width: 150px; text-align: right;">Running Balance (PKR)</th>
        </tr>
        ${rowsHtml}
        <tr style="background-color: #0F172A; color: #FFFFFF; font-weight: bold;">
          <td colspan="4" style="border: 1px solid #000; padding: 8px;">Closing Balance Summary</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #38BDF8; mso-number-format:'\\#\\,\\#\\#0';">${statementData.totalInvoiced}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #34D399; mso-number-format:'\\#\\,\\#\\#0';">${statementData.totalReceived}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #BAE6FD; font-size: 12pt; mso-number-format:'\\#\\,\\#\\#0';">${statementData.closingBalance}</td>
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

export function ClientStatementPrintModal({ client, dateFrom, dateTo, statementData, onClose }) {
  const [pageSize, setPageSize] = useState("A4");
  const printRef = useRef(null);

  const pkr = (val) => "PKR " + (Number(val) || 0).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const handleExportPDF = () => {
    const printEl = printRef.current;
    if (!printEl) return;
    const cName = (client.companyName || client.name).replace(/[^a-zA-Z0-9]/g, "_");

    const triggerPdf = () => {
      if (window.html2pdf) {
        const opt = {
          margin: 8,
          filename: `Client_Statement_${cName}_${dateFrom}_to_${dateTo}.pdf`,
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
    exportClientStatementToExcel({ client, dateFrom, dateTo, statementData });
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
            <span style={{ fontWeight: 800, fontSize: 13.5, color: "#0284C7", display: "flex", alignItems: "center", gap: 5 }}>
              <FileText size={16} /> Client Statement Preview
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select value={pageSize} onChange={e => setPageSize(e.target.value)} style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 8, color: "#FFF", fontSize: 12.5, fontWeight: 700, padding: "5px 10px", cursor: "pointer" }}>
              <option value="A4" style={{ background: "#1E293B", color: "#FFFFFF" }}>A4 (210 x 297 mm)</option>
              <option value="Letter" style={{ background: "#1E293B", color: "#FFFFFF" }}>Letter (8.5 x 11 in)</option>
              <option value="Legal" style={{ background: "#1E293B", color: "#FFFFFF" }}>Legal (8.5 x 14 in)</option>
            </select>
            <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12.5, fontWeight: 700, background: "#0284C7", borderColor: "#0284C7" }} onClick={handleExportPDF}>
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
                <img src="./logo.png" alt="AdPulse Logo" style={{ height: 70, maxHeight: 75, width: "auto", objectFit: "contain" }} onError={(e) => { e.target.style.display = 'none'; }} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px" }}>AdPulse IMC (Private) Ltd</div>
                  <div style={{ fontSize: 10.5, color: "#475569" }}>Financial Management &amp; Client Accounts Receivable Sub-Ledger</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0284C7", textTransform: "uppercase" }}>CLIENT STATEMENT</div>
                <div className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: "#0F172A" }}>STMT-{(client.clientCode || client.id || "").toUpperCase()}</div>
              </div>
            </div>

            {/* CLIENT & PERIOD INFO BOX */}
            <div style={{ background: "#F8FAFC", border: "1px solid #000000", borderRadius: 6, padding: "8px 12px", marginBottom: 12, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10, fontSize: 10.5 }}>
              <div>
                <div style={{ marginBottom: 3 }}><b>Client Account:</b> <span style={{ fontWeight: 700, fontSize: 11, color: "#0F172A" }}>{client.companyName || client.name}</span> <span style={{ color: "#64748B" }}>({client.clientCode || client.id})</span></div>
                <div style={{ marginBottom: 3 }}><b>Contact Person:</b> {client.contactPerson || "N/A"} {client.phone ? `(${client.phone})` : ""}</div>
                <div><b>Address:</b> {client.address || "Karachi, Pakistan"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ marginBottom: 3 }}><b>Statement Period:</b> <span style={{ fontWeight: 700 }}>{dateFrom} to {dateTo}</span></div>
                <div style={{ marginBottom: 3 }}><b>Payment Terms:</b> {client.paymentTerms || "Net 30"}</div>
                <div><b>NTN / STRN:</b> {client.ntn || "N/A"} {client.strn ? `/ ${client.strn}` : ""}</div>
              </div>
            </div>

            {/* 4 SUMMARY METRIC CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
              <div style={{ background: "#FFFFFF", padding: "6px 10px", borderRadius: 5, border: "1px solid #000000", textAlign: "center" }}>
                <div style={{ fontSize: 8.5, color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>Opening Balance</div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "#1E293B", marginTop: 2 }}>{pkr(statementData.openingBalance)}</div>
              </div>
              <div style={{ background: "#FFFFFF", padding: "6px 10px", borderRadius: 5, border: "1px solid #000000", textAlign: "center" }}>
                <div style={{ fontSize: 8.5, color: "#0284C7", fontWeight: 700, textTransform: "uppercase" }}>Total Invoiced (+)</div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0284C7", marginTop: 2 }}>{pkr(statementData.totalInvoiced)}</div>
              </div>
              <div style={{ background: "#FFFFFF", padding: "6px 10px", borderRadius: 5, border: "1px solid #000000", textAlign: "center" }}>
                <div style={{ fontSize: 8.5, color: "#059669", fontWeight: 700, textTransform: "uppercase" }}>Total Received (-)</div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "#059669", marginTop: 2 }}>{pkr(statementData.totalReceived)}</div>
              </div>
              <div style={{ background: "#E0F2FE", padding: "6px 10px", borderRadius: 5, border: "1.5px solid #0284C7", textAlign: "center" }}>
                <div style={{ fontSize: 8.5, color: "#0369A1", fontWeight: 800, textTransform: "uppercase" }}>Closing Outstanding</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: "#0369A1", marginTop: 2 }}>{pkr(statementData.closingBalance)}</div>
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
                  <th style={{ border: "1px solid #000", padding: "5px 5px", textAlign: "left", fontSize: 8.5, fontWeight: 800 }}>PROJECT / SCOPE</th>
                  <th style={{ border: "1px solid #000", padding: "4px 3px", textAlign: "right", fontSize: 8, fontWeight: 800, lineHeight: 1.15 }}>DEBIT / INVOICED<br/>(PKR)</th>
                  <th style={{ border: "1px solid #000", padding: "4px 3px", textAlign: "right", fontSize: 8, fontWeight: 800, lineHeight: 1.15 }}>CREDIT / RECEIVED<br/>(PKR)</th>
                  <th style={{ border: "1px solid #000", padding: "4px 3px", textAlign: "right", fontSize: 8, fontWeight: 800, lineHeight: 1.15 }}>RUNNING BALANCE<br/>(PKR)</th>
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
                  <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "right", fontWeight: 800 }}>{pkr(statementData.openingBalance)}</td>
                </tr>

                {statementData.rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ border: "1px solid #000", textAlign: "center", padding: 14, color: "#64748B" }}>
                      No client statement transactions recorded within this date range.
                    </td>
                  </tr>
                ) : (
                  statementData.rows.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "center", fontSize: 9 }}>{row.date}</td>
                      <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "center", fontWeight: 700, fontFamily: "monospace", fontSize: 8.8, whiteSpace: "nowrap" }}>{row.ref}</td>
                      <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "center", fontWeight: 600, fontSize: 8.8, color: row.type === "Invoice" ? "#0284C7" : "#059669" }}>
                        {row.type}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "5px 5px", wordBreak: "break-word", fontSize: 9 }}>{row.project}</td>
                      <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "right", color: row.debit > 0 ? "#0284C7" : "inherit", fontSize: 9, fontWeight: row.debit > 0 ? 700 : 400 }}>
                        {row.debit > 0 ? pkr(row.debit) : "—"}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "right", color: row.credit > 0 ? "#059669" : "inherit", fontSize: 9, fontWeight: row.credit > 0 ? 700 : 400 }}>
                        {row.credit > 0 ? pkr(row.credit) : "—"}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "right", fontWeight: 800, color: row.runningBalance > 0 ? "#0284C7" : "#059669", fontSize: 9.2 }}>
                        {pkr(row.runningBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: "#F1F5F9", fontWeight: 800 }}>
                  <td colSpan={4} style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "right", fontSize: 9 }}>Closing Balance Summary</td>
                  <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "right", color: "#0284C7", fontSize: 9 }}>{pkr(statementData.totalInvoiced)}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "right", color: "#059669", fontSize: 9 }}>{pkr(statementData.totalReceived)}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 3px", textAlign: "right", color: "#0369A1", fontSize: 9.5 }}>{pkr(statementData.closingBalance)}</td>
                </tr>
              </tfoot>
            </table>

            {/* AMOUNT IN WORDS */}
            <div style={{ fontSize: 9.5, fontStyle: "italic", color: "#334155", marginBottom: 12, background: "#F8FAFC", padding: "5px 8px", borderRadius: 4, border: "1px solid #000" }}>
              Closing Outstanding Balance in words: <b style={{ color: "#0F172A", fontStyle: "normal" }}>{amountInWords(statementData.closingBalance)}</b>
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

export default function ClientStatementView({
  clients = [],
  projects = [],
  invoices = [],
  vouchers = [],
  journal = [],
  selectedClientId,
  onSelectClient
}) {
  const [activeClientId, setActiveClientId] = useState(selectedClientId || (clients[0]?.id || ""));
  const [dateFrom, setDateFrom] = useState("2026-07-01");
  const [dateTo, setDateTo] = useState("2026-08-31");
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [selectedTxType, setSelectedTxType] = useState("all");
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    if (selectedClientId) {
      setActiveClientId(selectedClientId);
    }
  }, [selectedClientId]);

  const selectedClient = useMemo(() => {
    if (!clients || clients.length === 0) return null;
    return clients.find(c => c.id === activeClientId || c.clientCode === activeClientId) || clients[0] || null;
  }, [clients, activeClientId]);

  // Filter projects belonging ONLY to selected client
  const clientProjects = useMemo(() => {
    if (!selectedClient) return [];
    const clientNameNorm = (selectedClient.name || "").toLowerCase();
    return projects.filter(p => p.clientId === selectedClient.id || (p.client && p.client.toLowerCase() === clientNameNorm));
  }, [projects, selectedClient]);

  // Compute transactions & opening balance from posted journal entries / transactions
  const statementData = useMemo(() => {
    if (!selectedClient) {
      return { openingBalance: 0, rows: [], totalInvoiced: 0, totalReceived: 0, creditNotes: 0, closingBalance: 0 };
    }

    const clientNameNorm = (selectedClient.name || "").toLowerCase();

    // Helper: is transaction related to selected client?
    const isClientMatch = (item) => {
      if (!item || !selectedClient) return false;
      if (item.clientId === selectedClient.id) return true;
      if (item.client && item.client.toLowerCase() === clientNameNorm) return true;
      if (item.party && item.party.toLowerCase().includes(clientNameNorm)) return true;
      return false;
    };

    // Helper: is transaction related to selected project?
    const isProjectMatch = (item) => {
      if (selectedProjectId === "all") return true;
      return item.projectId === selectedProjectId;
    };

    // 1. Calculate Opening Balance from posted transactions BEFORE dateFrom
    let opening = Number(selectedClient.openingBalance) || 0;

    // Prior Invoices
    const priorInvoices = invoices.filter(i => isClientMatch(i) && isProjectMatch(i) && i.issueDate < dateFrom);
    priorInvoices.forEach(inv => {
      opening += Number(inv.totalAmount || inv.amount) || 0;
    });

    // Prior Receipts / Vouchers
    const priorVouchers = vouchers.filter(v => isClientMatch(v) && isProjectMatch(v) && v.date < dateFrom && v.type === "RV");
    priorVouchers.forEach(v => {
      opening -= Number(v.amount) || 0;
    });

    // 2. Filter Statement Transactions within [dateFrom, dateTo]
    const rawRows = [];

    // Add Invoices
    invoices.filter(i => isClientMatch(i) && isProjectMatch(i) && i.issueDate >= dateFrom && i.issueDate <= dateTo).forEach(inv => {
      const proj = projects.find(p => p.id === inv.projectId);
      rawRows.push({
        id: inv.id,
        date: inv.issueDate,
        dueDate: inv.dueDate,
        ref: cleanInvoiceNo(inv.invoiceNo || inv.id),
        type: "Invoice",
        project: proj ? proj.name : (inv.description || "General"),
        debit: Number(inv.totalAmount || inv.amount) || 0,
        credit: 0,
        status: inv.paid ? "Paid" : "Outstanding",
        raw: inv
      });
    });

    // Add Receipts / Vouchers
    vouchers.filter(v => isClientMatch(v) && isProjectMatch(v) && v.date >= dateFrom && v.date <= dateTo && (v.type === "RV" || v.type === "PV")).forEach(v => {
      const proj = projects.find(p => p.id === v.projectId);
      const isReceipt = v.type === "RV";
      rawRows.push({
        id: v.id,
        date: v.date,
        ref: v.voucherNo || ("VCH-" + v.id.toUpperCase()),
        type: isReceipt ? "Receipt" : "Payment",
        project: proj ? proj.name : (v.description || "Client Transaction"),
        debit: isReceipt ? 0 : Number(v.amount) || 0,
        credit: isReceipt ? Number(v.amount) || 0 : 0,
        status: v.status || "Posted",
        raw: v
      });
    });

    // Filter by Tx Type if set
    let filteredRows = rawRows;
    if (selectedTxType !== "all") {
      filteredRows = rawRows.filter(r => r.type.toLowerCase() === selectedTxType.toLowerCase());
    }

    // Sort chronologically
    filteredRows.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate Running Balance
    let running = opening;
    let totalInvoiced = 0;
    let totalReceived = 0;
    let creditNotes = 0;

    const rowsWithBalance = filteredRows.map(r => {
      running = running + r.debit - r.credit;
      if (r.type === "Invoice") totalInvoiced += r.debit;
      if (r.type === "Receipt") totalReceived += r.credit;
      if (r.type === "Credit Note") creditNotes += r.credit;
      return { ...r, runningBalance: running };
    });

    return {
      openingBalance: opening,
      rows: rowsWithBalance,
      totalInvoiced,
      totalReceived,
      creditNotes,
      closingBalance: running
    };
  }, [selectedClient, selectedProjectId, selectedTxType, dateFrom, dateTo, invoices, vouchers, projects]);

  // Project Summary Breakdown
  const projectSummary = useMemo(() => {
    if (!selectedClient) return [];
    return clientProjects.map(p => {
      const projInvoices = invoices.filter(i => i.projectId === p.id);
      const projVouchers = vouchers.filter(v => v.projectId === p.id && v.type === "RV");
      const invoiced = projInvoices.reduce((s, i) => s + (Number(i.totalAmount || i.amount) || 0), 0);
      const received = projVouchers.reduce((s, v) => s + (Number(v.amount) || 0), 0);
      return {
        id: p.id,
        name: p.name,
        type: p.type,
        value: Number(p.budget || p.contractValue) || 0,
        invoiced,
        received,
        outstanding: invoiced - received
      };
    });
  }, [selectedClient, clientProjects, invoices, vouchers]);

  // Client Aging Breakdown
  const agingReport = useMemo(() => {
    if (!selectedClient) return { current: 0, days30: 0, days60: 0, days90: 0, days90Plus: 0, total: 0 };
    const today = new Date();
    let current = 0, days30 = 0, days60 = 0, days90 = 0, days90Plus = 0;

    const clientInvoices = invoices.filter(i => {
      if (i.clientId === selectedClient.id) return true;
      return i.client && i.client.toLowerCase() === selectedClient.name.toLowerCase();
    }).filter(i => !i.paid);

    clientInvoices.forEach(inv => {
      const amt = Number(inv.totalAmount || inv.amount) || 0;
      const due = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.issueDate);
      const diffDays = Math.floor((today - due) / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) current += amt;
      else if (diffDays <= 30) days30 += amt;
      else if (diffDays <= 60) days60 += amt;
      else if (diffDays <= 90) days90 += amt;
      else days90Plus += amt;
    });

    return { current, days30, days60, days90, days90Plus, total: current + days30 + days60 + days90 + days90Plus };
  }, [selectedClient, invoices]);

  const pkr = (val) => "PKR " + (Number(val) || 0).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const handleExportExcel = () => {
    if (!selectedClient) return;
    exportClientStatementToExcel({ client: selectedClient, dateFrom, dateTo, statementData });
  };

  return (
    <div style={{ padding: 20 }}>
      {/* FILTER TOP BAR */}
      <div className="card" style={{ padding: 16, marginBottom: 20, background: "var(--card-bg)", borderRadius: 12, border: "1px solid var(--rule)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, marginBottom: 14, color: "var(--ink)" }}>
          <Filter size={18} color="#0284C7" /> Client Statement &amp; Sub-Ledger Filters
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label className="form-label">Select Client *</label>
            <select className="form-select" value={activeClientId} onChange={e => { setActiveClientId(e.target.value); if (onSelectClient) onSelectClient(e.target.value); }}>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.clientCode || c.id} — {c.name} ({c.companyName || "No Company"})
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
              <option value="all">All Client Projects</option>
              {clientProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Transaction Type</label>
            <select className="form-select" value={selectedTxType} onChange={e => setSelectedTxType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="invoice">Invoices Only</option>
              <option value="receipt">Receipts Only</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14, borderTop: "1px solid var(--rule)", paddingTop: 10 }}>
          <button className="btn" onClick={handleExportExcel} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "#059669", borderColor: "#059669", color: "#FFFFFF" }}>
            <Download size={15} /> Export Excel
          </button>
          <button className="btn btn-primary" onClick={() => setShowPrintModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "#0284C7", borderColor: "#0284C7" }}>
            <Printer size={15} /> Print / Save PDF Statement
          </button>
        </div>
      </div>

      {selectedClient ? (
        <div id="printable-client-statement">
          {/* STATEMENT HEADER */}
          <div className="card" style={{ padding: 20, marginBottom: 20, borderRadius: 12, border: "1.5px solid #0284C7", background: "linear-gradient(135deg, rgba(2, 132, 199, 0.04) 0%, rgba(2, 132, 199, 0.01) 100%)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ background: "#0284C7", color: "#FFFFFF", padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>CLIENT STATEMENT</span>
                <h2 style={{ margin: "8px 0 2px 0", fontSize: 22 }}>{selectedClient.companyName || selectedClient.name}</h2>
                <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                  Client ID: <strong>{selectedClient.clientCode || selectedClient.id}</strong> &middot; Contact: {selectedClient.contactPerson || "N/A"} ({selectedClient.phone || "N/A"})
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>
                  Address: {selectedClient.address || "Karachi, Pakistan"} &middot; NTN: {selectedClient.ntn || "N/A"} | STRN: {selectedClient.strn || "N/A"}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>Statement Period</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{dateFrom} to {dateTo}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-muted)" }}>Payment Terms: <strong>{selectedClient.paymentTerms || "Net 30"}</strong></div>
              </div>
            </div>

            {/* STATEMENT SUMMARY CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginTop: 20 }}>
              <div style={{ background: "var(--bg)", padding: 12, borderRadius: 8, border: "1px solid var(--rule)" }}>
                <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>Opening Balance</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", marginTop: 4 }}>{pkr(statementData.openingBalance)}</div>
              </div>

              <div style={{ background: "var(--bg)", padding: 12, borderRadius: 8, border: "1px solid var(--rule)" }}>
                <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>Total Invoiced (+)</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0284C7", marginTop: 4 }}>{pkr(statementData.totalInvoiced)}</div>
              </div>

              <div style={{ background: "var(--bg)", padding: 12, borderRadius: 8, border: "1px solid var(--rule)" }}>
                <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>Total Received (-)</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#059669", marginTop: 4 }}>{pkr(statementData.totalReceived)}</div>
              </div>

              <div style={{ background: "var(--bg)", padding: 12, borderRadius: 8, border: "1px solid var(--rule)" }}>
                <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>Credit Notes (-)</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#D97706", marginTop: 4 }}>{pkr(statementData.creditNotes)}</div>
              </div>

              <div style={{ background: "rgba(2, 132, 199, 0.08)", padding: 12, borderRadius: 8, border: "1.5px solid #0284C7" }}>
                <div style={{ fontSize: 11, color: "#0369A1", fontWeight: 700 }}>Closing Outstanding</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#0284C7", marginTop: 4 }}>{pkr(statementData.closingBalance)}</div>
              </div>

              <div style={{ background: agingReport.total > 0 ? "#FEF2F2" : "var(--bg)", padding: 12, borderRadius: 8, border: agingReport.total > 0 ? "1px solid #FCA5A5" : "1px solid var(--rule)" }}>
                <div style={{ fontSize: 11, color: agingReport.total > 0 ? "#991B1B" : "var(--ink-muted)", fontWeight: 700 }}>Total Overdue</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: agingReport.total > 0 ? "#DC2626" : "#059669", marginTop: 4 }}>{pkr(agingReport.days30 + agingReport.days60 + agingReport.days90 + agingReport.days90Plus)}</div>
              </div>
            </div>
          </div>

          {/* CLIENT AGING BAR */}
          <div className="card" style={{ padding: 16, marginBottom: 20, borderRadius: 10, border: "1px solid var(--rule)" }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: 14, color: "var(--ink)" }}>Client Receivables Aging Analysis</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, textAlign: "center" }}>
              <div style={{ background: "rgba(5, 150, 105, 0.08)", padding: 10, borderRadius: 6, border: "1px solid rgba(5, 150, 105, 0.3)" }}>
                <div style={{ fontSize: 11, color: "#047857", fontWeight: 700 }}>Current (Not Due)</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#047857", marginTop: 2 }}>{pkr(agingReport.current)}</div>
              </div>
              <div style={{ background: "rgba(245, 158, 11, 0.08)", padding: 10, borderRadius: 6, border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                <div style={{ fontSize: 11, color: "#B45309", fontWeight: 700 }}>1 – 30 Days Overdue</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#B45309", marginTop: 2 }}>{pkr(agingReport.days30)}</div>
              </div>
              <div style={{ background: "rgba(234, 88, 12, 0.08)", padding: 10, borderRadius: 6, border: "1px solid rgba(234, 88, 12, 0.3)" }}>
                <div style={{ fontSize: 11, color: "#C2410C", fontWeight: 700 }}>31 – 60 Days Overdue</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#C2410C", marginTop: 2 }}>{pkr(agingReport.days60)}</div>
              </div>
              <div style={{ background: "rgba(225, 29, 72, 0.08)", padding: 10, borderRadius: 6, border: "1px solid rgba(225, 29, 72, 0.3)" }}>
                <div style={{ fontSize: 11, color: "#BE123C", fontWeight: 700 }}>61 – 90 Days Overdue</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#BE123C", marginTop: 2 }}>{pkr(agingReport.days90)}</div>
              </div>
              <div style={{ background: "rgba(153, 27, 27, 0.12)", padding: 10, borderRadius: 6, border: "1px solid rgba(153, 27, 27, 0.4)" }}>
                <div style={{ fontSize: 11, color: "#991B1B", fontWeight: 800 }}>90+ Days Overdue</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#991B1B", marginTop: 2 }}>{pkr(agingReport.days90Plus)}</div>
              </div>
            </div>
          </div>

          {/* STATEMENT TABLE */}
          <div className="card" style={{ padding: 0, marginBottom: 20, borderRadius: 10, overflow: "hidden", border: "1px solid var(--rule)" }}>
            <div style={{ padding: "12px 16px", background: "var(--table-header-bg)", borderBottom: "1px solid var(--rule)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ margin: 0, fontSize: 14 }}>Client Ledger Activity &amp; Running Balance</h4>
              <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{statementData.rows.length} Transactions</span>
            </div>

            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Project</th>
                  <th style={{ textAlign: "right" }}>Debit (PKR)</th>
                  <th style={{ textAlign: "right" }}>Credit (PKR)</th>
                  <th style={{ textAlign: "right" }}>Balance (PKR)</th>
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
                  <td style={{ textAlign: "right", fontWeight: 800 }}>{pkr(statementData.openingBalance)}</td>
                </tr>

                {statementData.rows.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: 30, color: "var(--ink-muted)" }}>
                      No statement transactions recorded within this date range.
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
                          background: row.type === "Invoice" ? "rgba(2, 132, 199, 0.1)" : "rgba(5, 150, 105, 0.1)",
                          color: row.type === "Invoice" ? "#0284C7" : "#059669"
                        }}>
                          {row.type}
                        </span>
                      </td>
                      <td>{row.project}</td>
                      <td style={{ textAlign: "right", color: row.debit > 0 ? "#0284C7" : "inherit", fontWeight: row.debit > 0 ? 700 : 400 }}>
                        {row.debit > 0 ? pkr(row.debit) : "—"}
                      </td>
                      <td style={{ textAlign: "right", color: row.credit > 0 ? "#059669" : "inherit", fontWeight: row.credit > 0 ? 700 : 400 }}>
                        {row.credit > 0 ? pkr(row.credit) : "—"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 800, color: row.runningBalance > 0 ? "#0284C7" : "#059669" }}>
                        {pkr(row.runningBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: "var(--table-header-bg)", fontWeight: 800 }}>
                  <td colSpan="4">Closing Outstanding Balance</td>
                  <td style={{ textAlign: "right", color: "#0284C7" }}>{pkr(statementData.totalInvoiced)}</td>
                  <td style={{ textAlign: "right", color: "#059669" }}>{pkr(statementData.totalReceived)}</td>
                  <td style={{ textAlign: "right", fontSize: 15, color: "#0284C7" }}>{pkr(statementData.closingBalance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* PROJECT SUMMARY TABLE */}
          {projectSummary.length > 0 && (
            <div className="card" style={{ padding: 0, borderRadius: 10, overflow: "hidden", border: "1px solid var(--rule)" }}>
              <div style={{ padding: "12px 16px", background: "var(--table-header-bg)", borderBottom: "1px solid var(--rule)" }}>
                <h4 style={{ margin: 0, fontSize: 14 }}>Client Project-Wise Summary</h4>
              </div>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Project Type</th>
                    <th style={{ textAlign: "right" }}>Project Value</th>
                    <th style={{ textAlign: "right" }}>Total Invoiced</th>
                    <th style={{ textAlign: "right" }}>Total Received</th>
                    <th style={{ textAlign: "right" }}>Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {projectSummary.map(ps => (
                    <tr key={ps.id}>
                      <td style={{ fontWeight: 700 }}>{ps.name}</td>
                      <td>{ps.type}</td>
                      <td style={{ textAlign: "right" }}>{pkr(ps.value)}</td>
                      <td style={{ textAlign: "right", color: "#0284C7", fontWeight: 600 }}>{pkr(ps.invoiced)}</td>
                      <td style={{ textAlign: "right", color: "#059669", fontWeight: 600 }}>{pkr(ps.received)}</td>
                      <td style={{ textAlign: "right", fontWeight: 800, color: ps.outstanding > 0 ? "#DC2626" : "#059669" }}>
                        {pkr(ps.outstanding)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: 40, color: "var(--ink-muted)" }}>
          No client selected. Please register or select a client above.
        </div>
      )}

      {/* RENDER DEDICATED PRINT/PDF MODAL */}
      {showPrintModal && selectedClient && (
        <ClientStatementPrintModal
          client={selectedClient}
          dateFrom={dateFrom}
          dateTo={dateTo}
          statementData={statementData}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
