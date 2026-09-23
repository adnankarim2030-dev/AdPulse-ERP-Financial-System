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
  const [pageOrientation, setPageOrientation] = useState("portrait");
  const [pageMargin, setPageMargin] = useState("8mm");
  const [printScale, setPrintScale] = useState("100%");
  const printRef = useRef(null);

  const pkr = (val) => "PKR " + (Number(val) || 0).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const handleExportPDF = () => {
    const printEl = printRef.current;
    if (!printEl) return;
    const cName = (client.companyName || client.name).replace(/[^a-zA-Z0-9]/g, "_");

    const triggerPdf = () => {
      if (window.html2pdf) {
        const opt = {
          margin: 6,
          filename: `Client_Statement_${cName}_${dateFrom}_to_${dateTo}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: (pageSize || "A4").toLowerCase(), orientation: pageOrientation || "portrait" }
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

  const printScaleFactor = parseInt(printScale) / 100;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <style>{`
        @page {
          size: ${pageSize} ${pageOrientation};
          margin: ${pageMargin};
        }
        .print-area table {
          width: 100% !important;
          max-width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
          border: 1px solid #CBD5E1 !important;
        }
        .print-area th {
          font-size: 8.5px !important;
          padding: 5px 3px !important;
          text-align: center !important;
          vertical-align: middle !important;
          font-weight: 700 !important;
          background: #F1F5F9 !important;
          color: #0F172A !important;
          border: 1px solid #CBD5E1 !important;
          text-transform: uppercase !important;
        }
        .print-area td {
          font-size: 8.5px !important;
          padding: 4px 4px !important;
          vertical-align: middle !important;
          border: 1px solid #E2E8F0 !important;
          color: #0F172A !important;
          word-break: break-word !important;
        }
        @media print {
          *, *::before, *::after {
            box-shadow: none !important;
            text-shadow: none !important;
          }
          html, body, #root {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            height: auto !important;
            width: 100% !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          .print-area, .print-area * {
            visibility: visible !important;
          }
          .no-print-header, .no-print, .sidebar, .topbar, .btn, .mobile-toggle, .content, .main, button {
            display: none !important;
            visibility: hidden !important;
          }
          .modal-backdrop {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: none !important;
            overflow: visible !important;
          }
          .modal {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            background: transparent !important;
          }
          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            transform: scale(${printScaleFactor});
            transform-origin: top left;
            width: ${100 / printScaleFactor}% !important;
            max-width: ${100 / printScaleFactor}% !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          .print-area thead {
            display: table-header-group !important;
          }
          .print-area tfoot {
            display: table-footer-group !important;
          }
          .print-area tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-signatures, .invoice-footer-banner {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .invoice-footer-banner {
            background: #A81C1C !important;
            background-image: linear-gradient(90deg, #A81C1C 0%, #1D3B4E 100%) !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            display: flex !important;
            visibility: visible !important;
            margin-top: 14px !important;
          }
        }
      `}</style>
      <div className="modal" style={{ width: 960, maxWidth: "98vw", maxHeight: "94vh", overflowY: "auto", background: "var(--card-bg, #0F172A)", borderRadius: 12, border: "1px solid #334155" }} onClick={e => e.stopPropagation()}>
        {/* MODAL TOP TOOLBAR */}
        <div className="no-print-header" style={{ background: "#1E293B", padding: "12px 18px", borderBottom: "1px solid #334155", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: "#38BDF8", display: "flex", alignItems: "center", gap: 6 }}>
              <FileText size={18} /> Official Letterhead Print Preview
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#0F172A", padding: "4px 8px", borderRadius: 8, border: "1px solid #334155" }}>
              <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>Paper:</span>
              <select value={pageSize} onChange={e => setPageSize(e.target.value)} style={{ background: "transparent", border: "none", color: "#FFF", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <option value="A4" style={{ background: "#1E293B", color: "#FFFFFF" }}>A4 (210 x 297 mm)</option>
                <option value="Letter" style={{ background: "#1E293B", color: "#FFFFFF" }}>Letter (8.5 x 11 in)</option>
                <option value="Legal" style={{ background: "#1E293B", color: "#FFFFFF" }}>Legal (8.5 x 14 in)</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#0F172A", padding: "4px 8px", borderRadius: 8, border: "1px solid #334155" }}>
              <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>Orient:</span>
              <select value={pageOrientation} onChange={e => setPageOrientation(e.target.value)} style={{ background: "transparent", border: "none", color: "#FFF", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <option value="portrait" style={{ background: "#1E293B", color: "#FFFFFF" }}>Portrait 📄</option>
                <option value="landscape" style={{ background: "#1E293B", color: "#FFFFFF" }}>Landscape 📑</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#0F172A", padding: "4px 8px", borderRadius: 8, border: "1px solid #334155" }}>
              <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>Margin:</span>
              <select value={pageMargin} onChange={e => setPageMargin(e.target.value)} style={{ background: "transparent", border: "none", color: "#FFF", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <option value="8mm" style={{ background: "#1E293B", color: "#FFFFFF" }}>Compact (8mm)</option>
                <option value="12mm" style={{ background: "#1E293B", color: "#FFFFFF" }}>Normal (12mm)</option>
                <option value="15mm" style={{ background: "#1E293B", color: "#FFFFFF" }}>Wide (15mm)</option>
                <option value="0mm" style={{ background: "#1E293B", color: "#FFFFFF" }}>Zero (0mm)</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#0F172A", padding: "4px 8px", borderRadius: 8, border: "1px solid #334155" }}>
              <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>Scale:</span>
              <select value={printScale} onChange={e => setPrintScale(e.target.value)} style={{ background: "transparent", border: "none", color: "#FFF", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <option value="100%" style={{ background: "#1E293B", color: "#FFFFFF" }}>100%</option>
                <option value="95%" style={{ background: "#1E293B", color: "#FFFFFF" }}>95%</option>
                <option value="90%" style={{ background: "#1E293B", color: "#FFFFFF" }}>90%</option>
                <option value="85%" style={{ background: "#1E293B", color: "#FFFFFF" }}>85%</option>
              </select>
            </div>

            <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12, fontWeight: 700, background: "#0284C7", borderColor: "#0284C7", color: "#FFFFFF" }} onClick={handleExportPDF}>
              <Download size={13} /> PDF
            </button>
            <button className="btn" style={{ background: "#059669", color: "#FFFFFF", border: "none", padding: "6px 12px", fontSize: 12, fontWeight: 700 }} onClick={handleExportExcel}>
              <Download size={13} /> Excel
            </button>
            <button className="btn" style={{ background: "#334155", color: "#FFFFFF", border: "none", padding: "6px 14px", fontSize: 12, fontWeight: 700 }} onClick={() => window.print()}>
              <Printer size={13} /> Printout
            </button>
            <button className="btn" style={{ background: "var(--rose)", color: "#fff", border: "none", padding: "5px 9px" }} onClick={onClose}><X size={15} /></button>
          </div>
        </div>

        {/* PRINTABLE AREA CONTAINER (A4 Paper Box) */}
        <div style={{ padding: "20px", display: "flex", justifyContent: "center", background: "#334155" }}>
          <div ref={printRef} className="print-area" style={{ background: "#ffffff", color: "#0F172A", width: "100%", maxWidth: "820px", padding: "20px 24px", fontFamily: "'Calibri', 'Inter', sans-serif", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box", boxShadow: "0 8px 24px rgba(0,0,0,0.25)", borderRadius: 4, border: "1px solid #E2E8F0" }}>
            <div>
              {/* TOP LETTERHEAD HEADER */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid #0F172A", paddingBottom: 10, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <img src="./logo.png" alt="AdPulse Logo" style={{ height: 64, maxHeight: 68, width: "auto", objectFit: "contain" }} onError={(e) => { e.target.style.display = 'none'; }} />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.4px" }}>AdPulse IMC (Private) Ltd</div>
                    <div style={{ fontSize: 10, color: "#475569", fontWeight: 600 }}>Financial Management &amp; Client Accounts Receivable Sub-Ledger</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0284C7", textTransform: "uppercase", letterSpacing: "0.5px" }}>CLIENT STATEMENT</div>
                  <div className="mono" style={{ fontSize: 10.5, fontWeight: 700, color: "#0F172A" }}>STMT-{(client.clientCode || client.id || "").toUpperCase()}</div>
                </div>
              </div>

              {/* CLIENT & PERIOD INFO BOX */}
              <div style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 5, padding: "8px 12px", marginBottom: 10, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10, fontSize: 10 }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 8 }}>
                <div style={{ background: "#FFFFFF", padding: "6px 8px", borderRadius: 4, border: "1px solid #CBD5E1", textAlign: "center" }}>
                  <div style={{ fontSize: 8, color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>Opening Balance</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#1E293B", marginTop: 2 }}>{pkr(statementData.openingBalance)}</div>
                </div>
                <div style={{ background: "#FFFFFF", padding: "6px 8px", borderRadius: 4, border: "1px solid #CBD5E1", textAlign: "center" }}>
                  <div style={{ fontSize: 8, color: "#0284C7", fontWeight: 700, textTransform: "uppercase" }}>Total Invoiced (+)</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#0284C7", marginTop: 2 }}>{pkr(statementData.totalInvoiced)}</div>
                </div>
                <div style={{ background: "#FFFFFF", padding: "6px 8px", borderRadius: 4, border: "1px solid #CBD5E1", textAlign: "center" }}>
                  <div style={{ fontSize: 8, color: "#059669", fontWeight: 700, textTransform: "uppercase" }}>Total Received (-)</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#059669", marginTop: 2 }}>{pkr(statementData.totalReceived)}</div>
                </div>
                <div style={{ background: "#E0F2FE", padding: "6px 8px", borderRadius: 4, border: "1px solid #0284C7", textAlign: "center" }}>
                  <div style={{ fontSize: 8, color: "#0369A1", fontWeight: 800, textTransform: "uppercase" }}>Closing Outstanding</div>
                  <div style={{ fontSize: 11.5, fontWeight: 900, color: "#0369A1", marginTop: 2 }}>{pkr(statementData.closingBalance)}</div>
                </div>
              </div>

              {/* TAX BREAKDOWN BANNER */}
              {statementData.totalGrossInvoiced > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 4, padding: "4px 8px", marginBottom: 8, fontSize: 8, color: "#1E293B" }}>
                  <span><b>Gross Invoiced:</b> {pkr(statementData.totalGrossInvoiced)}</span>
                  <span><b>Output SST (SRB/PRA):</b> {pkr(statementData.totalSstInvoiced)}</span>
                  <span><b>WHT Withheld (FBR):</b> {pkr(statementData.totalWhtWithheld)}</span>
                  <span><b>SST Withheld:</b> {pkr(statementData.totalSstWithheld)}</span>
                  <span><b>Net Realized:</b> {pkr(statementData.totalReceived)}</span>
                </div>
              )}

              {/* TRANSACTIONS TABLE */}
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10, fontSize: 8.5, tableLayout: "fixed" }}>
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
                    <th style={{ border: "1px solid #CBD5E1", padding: "5px 3px", textAlign: "center", fontSize: 8.2, fontWeight: 700 }}>DATE</th>
                    <th style={{ border: "1px solid #CBD5E1", padding: "5px 3px", textAlign: "center", fontSize: 8.2, fontWeight: 700 }}>REF NO</th>
                    <th style={{ border: "1px solid #CBD5E1", padding: "5px 3px", textAlign: "center", fontSize: 8.2, fontWeight: 700 }}>TYPE</th>
                    <th style={{ border: "1px solid #CBD5E1", padding: "5px 4px", textAlign: "left", fontSize: 8.2, fontWeight: 700 }}>PROJECT / SCOPE</th>
                    <th style={{ border: "1px solid #CBD5E1", padding: "4px 3px", textAlign: "right", fontSize: 7.8, fontWeight: 700, lineHeight: 1.15 }}>DEBIT / INVOICED<br/>(PKR)</th>
                    <th style={{ border: "1px solid #CBD5E1", padding: "4px 3px", textAlign: "right", fontSize: 7.8, fontWeight: 700, lineHeight: 1.15 }}>CREDIT / RECEIVED<br/>(PKR)</th>
                    <th style={{ border: "1px solid #CBD5E1", padding: "4px 3px", textAlign: "right", fontSize: 7.8, fontWeight: 700, lineHeight: 1.15 }}>RUNNING BALANCE<br/>(PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: "#F8FAFC", fontWeight: 600 }}>
                    <td style={{ border: "1px solid #E2E8F0", padding: "4px 3px", textAlign: "center" }}>{dateFrom}</td>
                    <td style={{ border: "1px solid #E2E8F0", padding: "4px 3px", textAlign: "center", fontWeight: 700, fontFamily: "monospace" }}>OB-000</td>
                    <td style={{ border: "1px solid #E2E8F0", padding: "4px 3px", textAlign: "center" }}>Opening Balance</td>
                    <td style={{ border: "1px solid #E2E8F0", padding: "4px 4px" }}>—</td>
                    <td style={{ border: "1px solid #E2E8F0", padding: "4px 3px", textAlign: "right" }}>—</td>
                    <td style={{ border: "1px solid #E2E8F0", padding: "4px 3px", textAlign: "right" }}>—</td>
                    <td style={{ border: "1px solid #E2E8F0", padding: "4px 3px", textAlign: "right", fontWeight: 700 }}>{pkr(statementData.openingBalance)}</td>
                  </tr>

                  {statementData.rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ border: "1px solid #E2E8F0", textAlign: "center", padding: 12, color: "#64748B" }}>
                        No client statement transactions recorded within this date range.
                      </td>
                    </tr>
                  ) : (
                    statementData.rows.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ border: "1px solid #E2E8F0", padding: "4px 3px", textAlign: "center", fontSize: 8.5 }}>{row.date}</td>
                        <td style={{ border: "1px solid #E2E8F0", padding: "4px 3px", textAlign: "center", fontWeight: 700, fontFamily: "monospace", fontSize: 8.2, whiteSpace: "nowrap" }}>{row.ref}</td>
                        <td style={{ border: "1px solid #E2E8F0", padding: "4px 3px", textAlign: "center", fontWeight: 600, fontSize: 8.2, color: row.type === "Invoice" ? "#0284C7" : "#059669" }}>
                          {row.type}
                        </td>
                        <td style={{ border: "1px solid #E2E8F0", padding: "4px 4px", wordBreak: "break-word", fontSize: 8.5 }}>
                          <div style={{ fontWeight: 600 }}>{row.project}</div>
                          {row.taxBreakdown && row.taxBreakdown.kind === "invoice" && (
                            <div style={{ fontSize: 7.2, color: "#475569", marginTop: 2, lineHeight: 1.2 }}>
                              Gross: {pkr(row.taxBreakdown.gross)} {row.taxBreakdown.sst > 0 ? `| SST (${row.taxBreakdown.sstRate}%): +${pkr(row.taxBreakdown.sst)}` : ""} {row.taxBreakdown.discount > 0 ? `| Disc: -${pkr(row.taxBreakdown.discount)}` : ""}
                            </div>
                          )}
                          {row.taxBreakdown && row.taxBreakdown.kind === "receipt" && (
                            <div style={{ fontSize: 7.2, color: "#047857", marginTop: 2, lineHeight: 1.2 }}>
                              Gross: {pkr(row.taxBreakdown.gross)} {row.taxBreakdown.wht > 0 ? `| WHT (${row.taxBreakdown.whtRate}%): -${pkr(row.taxBreakdown.wht)}` : ""} {row.taxBreakdown.sst > 0 ? `| SST Withheld (${row.taxBreakdown.sstRate}%): -${pkr(row.taxBreakdown.sst)}` : ""} | Net Rec: {pkr(row.taxBreakdown.net)} {row.taxBreakdown.mode ? `[${row.taxBreakdown.mode}${row.taxBreakdown.instrumentNo ? ` #${row.taxBreakdown.instrumentNo}` : ""}]` : ""}
                            </div>
                          )}
                          {row.taxBreakdown && row.taxBreakdown.kind === "direct_settlement" && (
                            <div style={{ fontSize: 7.2, color: "#B45309", marginTop: 2, lineHeight: 1.2 }}>
                              Direct Settled: {pkr(row.taxBreakdown.amount)} {row.taxBreakdown.mode ? `[${row.taxBreakdown.mode}${row.taxBreakdown.instrumentNo ? ` #${row.taxBreakdown.instrumentNo}` : ""}]` : ""}
                            </div>
                          )}
                        </td>
                        <td style={{ border: "1px solid #E2E8F0", padding: "4px 3px", textAlign: "right", color: row.debit > 0 ? "#0284C7" : "inherit", fontSize: 8.5, fontWeight: row.debit > 0 ? 700 : 400 }}>
                          {row.debit > 0 ? pkr(row.debit) : "—"}
                        </td>
                        <td style={{ border: "1px solid #E2E8F0", padding: "4px 3px", textAlign: "right", color: row.credit > 0 ? "#059669" : "inherit", fontSize: 8.5, fontWeight: row.credit > 0 ? 700 : 400 }}>
                          {row.credit > 0 ? pkr(row.credit) : "—"}
                        </td>
                        <td style={{ border: "1px solid #E2E8F0", padding: "4px 3px", textAlign: "right", fontWeight: 700, color: row.runningBalance > 0 ? "#0284C7" : "#059669", fontSize: 8.8 }}>
                          {pkr(row.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#F1F5F9", fontWeight: 700 }}>
                    <td colSpan={4} style={{ border: "1px solid #CBD5E1", padding: "5px 6px", textAlign: "right", fontSize: 8.5 }}>Closing Balance Summary</td>
                    <td style={{ border: "1px solid #CBD5E1", padding: "5px 3px", textAlign: "right", color: "#0284C7", fontSize: 8.5 }}>{pkr(statementData.totalInvoiced)}</td>
                    <td style={{ border: "1px solid #CBD5E1", padding: "5px 3px", textAlign: "right", color: "#059669", fontSize: 8.5 }}>{pkr(statementData.totalReceived)}</td>
                    <td style={{ border: "1px solid #CBD5E1", padding: "5px 3px", textAlign: "right", color: "#0369A1", fontSize: 9 }}>{pkr(statementData.closingBalance)}</td>
                  </tr>
                </tfoot>
              </table>

              {/* AMOUNT IN WORDS */}
              <div style={{ fontSize: 8.5, fontStyle: "italic", color: "#334155", marginBottom: 10, background: "#F8FAFC", padding: "5px 8px", borderRadius: 4, border: "1px solid #E2E8F0" }}>
                Closing Outstanding Balance in words: <b style={{ color: "#0F172A", fontStyle: "normal" }}>{amountInWords(statementData.closingBalance)}</b>
              </div>
            </div>

            {/* BOTTOM PINNED: SIGNATURES & FOOTER */}
            <div className="print-signatures" style={{ marginTop: "auto", paddingTop: 10 }}>
              {/* SIGNATURES */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8, fontSize: 8.5, fontWeight: 700 }}>
                <div style={{ textAlign: "center", width: 170 }}>
                  <div style={{ borderTop: "1.2px solid #0F172A", paddingTop: 4, letterSpacing: "0.3px" }}>PREPARED BY</div>
                </div>
                <div style={{ textAlign: "center", width: 170 }}>
                  <div style={{ borderTop: "1.2px solid #0F172A", paddingTop: 4, letterSpacing: "0.3px" }}>ACCOUNTS MANAGER</div>
                </div>
                <div style={{ textAlign: "center", width: 170 }}>
                  <div style={{ borderTop: "1.2px solid #0F172A", paddingTop: 4, letterSpacing: "0.3px" }}>AUTHORIZED SIGNATORY</div>
                </div>
              </div>

              {/* FOOTER BANNER */}
              <div className="invoice-footer-banner" style={{ background: "#A81C1C", backgroundImage: "linear-gradient(90deg, #A81C1C 0%, #1D3B4E 100%)", color: "#FFFFFF", padding: "5px 12px", borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 8, fontWeight: 600, boxSizing: "border-box" }}>
                <div>📞 +92 21 37526834</div>
                <div>✉️ communication@adpulse.pk | 🌐 www.adpulse.pk</div>
                <div>📍 Office # 213, 2nd Floor, Park Tower, Block 5 Clifton, Karachi.</div>
              </div>
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
  onSelectClient,
  isModal = false,
  onClose
}) {
  const [activeClientId, setActiveClientId] = useState(selectedClientId || (clients[0]?.id || ""));
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-12-31");
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [selectedTxType, setSelectedTxType] = useState("all");
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(true);

  useEffect(() => {
    if (selectedClientId) {
      setActiveClientId(selectedClientId);
    }
  }, [selectedClientId]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isModal || !onClose) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !showPrintModal) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModal, onClose, showPrintModal]);

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

    // Prior Receipts / Vouchers / Direct Settlements
    const priorVouchers = vouchers.filter(v => isClientMatch(v) && isProjectMatch(v) && v.date < dateFrom && (v.type === "RV" || v.type === "CV"));
    priorVouchers.forEach(v => {
      opening -= Number(v.amount) || 0;
    });

    // 2. Filter Statement Transactions within [dateFrom, dateTo]
    const rawRows = [];

    // Add Invoices
    invoices.filter(i => isClientMatch(i) && isProjectMatch(i) && i.issueDate >= dateFrom && i.issueDate <= dateTo).forEach(inv => {
      const proj = projects.find(p => p.id === inv.projectId);
      const gross = Number(inv.subtotal || (Number(inv.totalAmount || inv.amount || 0) - Number(inv.tax || inv.salesTax || 0) + Number(inv.discount || 0))) || Number(inv.totalAmount || inv.amount) || 0;
      const discount = Number(inv.discount) || 0;
      const comm = Number(inv.agencyCommission || inv.commission) || 0;
      const sst = Number(inv.tax || inv.salesTax || inv.sstAmount) || 0;
      const sstRate = Number(inv.salesTaxRate || inv.taxRate) || (gross > 0 && sst > 0 ? Math.round((sst / gross) * 100) : 0);
      const total = Number(inv.totalAmount || inv.amount) || 0;

      rawRows.push({
        id: inv.id,
        date: inv.issueDate,
        dueDate: inv.dueDate,
        ref: cleanInvoiceNo(inv.invoiceNo || inv.id),
        type: "Invoice",
        project: proj ? proj.name : (inv.description || "General"),
        debit: total,
        credit: 0,
        status: inv.paid ? "Paid" : "Outstanding",
        taxBreakdown: {
          kind: "invoice",
          gross,
          discount,
          comm,
          sst,
          sstRate,
          total
        },
        raw: inv
      });
    });

    // Add Receipts / Vouchers / Direct Settlements
    vouchers.filter(v => isClientMatch(v) && isProjectMatch(v) && v.date >= dateFrom && v.date <= dateTo && (v.type === "RV" || v.type === "PV" || v.type === "CV")).forEach(v => {
      const proj = projects.find(p => p.id === v.projectId);
      const isPdcBounced = v.isPdc && v.pdcStatus === "Bounced";
      const isCredit = (v.type === "RV" || v.type === "CV") && !isPdcBounced;
      
      let typeLabel = "Receipt";
      if (v.type === "CV") typeLabel = "Direct Settlement";
      else if (v.isPdc) typeLabel = isPdcBounced ? "Cheque Bounced" : "PDC Cheque";
      else if (v.type === "PV") typeLabel = "Payment";

      let defaultDesc = v.description || "Client Transaction";
      if (v.type === "CV") {
        defaultDesc = `Direct Settlement to Vendor (${v.category || v.vendor || "Vendor"})${v.instrumentNo ? ` [${v.paymentMode || 'Inst'} #${v.instrumentNo}]` : ""}`;
      } else if (v.isPdc) {
        defaultDesc = isPdcBounced 
          ? `PDC Dishonored/Bounced [Chq #${v.chequeNo || 'PDC'}] (${v.bounceReason || 'Return'})`
          : `Post-Dated Cheque In-Hand [Chq #${v.chequeNo || 'PDC'}] (Due: ${v.chequeDate || v.date})`;
      }

      // Compute Receipt Tax Details
      const netPaid = Number(v.amount) || 0;
      const wht = Number(v.whtAmount) || 0;
      const whtRate = Number(v.whtRate) || 0;
      const sst = Number(v.sstWithheld) || 0;
      const sstRate = Number(v.sstRate) || 0;
      const grossSettled = Number(v.grossAmount) || (netPaid + wht + sst);

      let taxBreakdown = null;
      if (v.type === "RV") {
        taxBreakdown = {
          kind: "receipt",
          gross: grossSettled,
          wht,
          whtRate,
          sst,
          sstRate,
          net: netPaid,
          mode: v.paymentMode || (v.isPdc ? "Post-Dated Cheque" : "Cross Cheque / Bank"),
          instrumentNo: v.instrumentNo || v.chequeNo,
          bank: v.bankAccount || v.bank
        };
      } else if (v.type === "CV") {
        taxBreakdown = {
          kind: "direct_settlement",
          amount: netPaid,
          mode: v.paymentMode || "Direct Settlement",
          instrumentNo: v.instrumentNo || v.chequeNo,
          vendor: v.category || v.vendor || v.party || "Vendor"
        };
      }

      rawRows.push({
        id: v.id,
        date: v.date,
        ref: v.voucherNo || ("VCH-" + v.id.toUpperCase()),
        type: typeLabel,
        project: proj ? proj.name : defaultDesc,
        debit: isCredit ? 0 : Number(v.amount) || 0,
        credit: isCredit ? Number(v.amount) || 0 : 0,
        status: v.isPdc ? (v.pdcStatus || "In-Hand") : (v.status || "Posted"),
        taxBreakdown,
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

    // Calculate Running Balance and Tax Metrics
    let running = opening;
    let totalInvoiced = 0;
    let totalReceived = 0;
    let creditNotes = 0;

    let totalGrossInvoiced = 0;
    let totalSstInvoiced = 0;
    let totalGrossReceived = 0;
    let totalWhtWithheld = 0;
    let totalSstWithheld = 0;

    const rowsWithBalance = filteredRows.map(r => {
      running = running + r.debit - r.credit;
      if (r.type === "Invoice") {
        totalInvoiced += r.debit;
        if (r.taxBreakdown) {
          totalGrossInvoiced += (r.taxBreakdown.gross || r.debit);
          totalSstInvoiced += (r.taxBreakdown.sst || 0);
        }
      }
      if (r.type === "Receipt" || r.type === "PDC Cheque" || r.type === "Direct Settlement") {
        totalReceived += r.credit;
        if (r.taxBreakdown && r.taxBreakdown.kind === "receipt") {
          totalGrossReceived += (r.taxBreakdown.gross || r.credit);
          totalWhtWithheld += (r.taxBreakdown.wht || 0);
          totalSstWithheld += (r.taxBreakdown.sst || 0);
        }
      }
      if (r.type === "Credit Note") creditNotes += r.credit;
      return { ...r, runningBalance: running };
    });

    return {
      openingBalance: opening,
      rows: rowsWithBalance,
      totalInvoiced,
      totalReceived,
      creditNotes,
      closingBalance: running,
      totalGrossInvoiced,
      totalSstInvoiced,
      totalGrossReceived,
      totalWhtWithheld,
      totalSstWithheld
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

  const mainContent = (
    <div style={{ padding: isModal ? 0 : 20 }}>
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
          <button
            className="btn"
            onClick={() => setShowTaxBreakdown(!showTaxBreakdown)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              background: showTaxBreakdown ? "rgba(2, 132, 199, 0.12)" : "var(--bg)",
              borderColor: "#0284C7",
              color: "#0284C7",
              fontWeight: 600
            }}
          >
            {showTaxBreakdown ? "✓ Tax & Gross Breakdown: ON" : "Show Tax & Gross Breakdown"}
          </button>
          <button className="btn" onClick={handleExportExcel} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "#059669", borderColor: "#059669", color: "#FFFFFF" }}>
            <Download size={15} /> Export Excel
          </button>
          <button className="btn btn-primary" onClick={() => setShowPrintModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "#0284C7", borderColor: "#0284C7", color: "#FFFFFF" }}>
            <Printer size={15} /> Print Preview &amp; Printout
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

            {/* TAX BREAKDOWN SUMMARY RIBBON */}
            {showTaxBreakdown && (
              <div style={{
                marginTop: 14,
                padding: "10px 16px",
                borderRadius: 8,
                background: "rgba(2, 132, 199, 0.06)",
                border: "1px dashed #0284C7",
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 12,
                fontSize: 12
              }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>Pre-Tax Gross Invoiced</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1E293B", marginTop: 2 }}>{pkr(statementData.totalGrossInvoiced)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>Output SST (Sales Tax)</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0284C7", marginTop: 2 }}>{pkr(statementData.totalSstInvoiced)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>Client WHT Withheld (FBR)</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#D97706", marginTop: 2 }}>{pkr(statementData.totalWhtWithheld)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>Client SST Withheld (SRB)</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#8B5CF6", marginTop: 2 }}>{pkr(statementData.totalSstWithheld)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>Net Cash Realized</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#059669", marginTop: 2 }}>{pkr(statementData.totalReceived)}</div>
                </div>
              </div>
            )}
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
                      <td>
                        <div style={{ fontWeight: 600 }}>{row.project}</div>
                        {showTaxBreakdown && row.taxBreakdown && (
                          <div style={{ marginTop: 5, display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {row.taxBreakdown.kind === "invoice" && (
                              <>
                                <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(100, 116, 139, 0.12)", color: "#475569", fontWeight: 600 }}>
                                  Gross: {pkr(row.taxBreakdown.gross)}
                                </span>
                                {row.taxBreakdown.sst > 0 && (
                                  <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(2, 132, 199, 0.12)", color: "#0284C7", fontWeight: 700 }}>
                                    + Output SST ({row.taxBreakdown.sstRate}%): {pkr(row.taxBreakdown.sst)}
                                  </span>
                                )}
                                {row.taxBreakdown.discount > 0 && (
                                  <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(220, 38, 38, 0.12)", color: "#DC2626", fontWeight: 600 }}>
                                    - Discount: {pkr(row.taxBreakdown.discount)}
                                  </span>
                                )}
                                <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(15, 23, 42, 0.08)", color: "#0F172A", fontWeight: 700 }}>
                                  Total: {pkr(row.taxBreakdown.total)}
                                </span>
                              </>
                            )}
                            {row.taxBreakdown.kind === "receipt" && (
                              <>
                                <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(100, 116, 139, 0.12)", color: "#475569", fontWeight: 600 }}>
                                  Gross Settled: {pkr(row.taxBreakdown.gross)}
                                </span>
                                {row.taxBreakdown.wht > 0 && (
                                  <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(217, 119, 6, 0.12)", color: "#B45309", fontWeight: 700 }}>
                                    - Less WHT ({row.taxBreakdown.whtRate}%): {pkr(row.taxBreakdown.wht)}
                                  </span>
                                )}
                                {row.taxBreakdown.sst > 0 && (
                                  <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(139, 92, 246, 0.12)", color: "#7C3AED", fontWeight: 700 }}>
                                    - Less SST ({row.taxBreakdown.sstRate}%): {pkr(row.taxBreakdown.sst)}
                                  </span>
                                )}
                                <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(5, 150, 105, 0.12)", color: "#059669", fontWeight: 800 }}>
                                  Net Deposited: {pkr(row.taxBreakdown.net)}
                                </span>
                                {row.taxBreakdown.mode && (
                                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "var(--bg)", border: "1px solid var(--rule)", color: "var(--ink-muted)" }}>
                                    {row.taxBreakdown.mode}{row.taxBreakdown.instrumentNo ? ` #${row.taxBreakdown.instrumentNo}` : ""}
                                  </span>
                                )}
                              </>
                            )}
                            {row.taxBreakdown.kind === "direct_settlement" && (
                              <>
                                <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(217, 119, 6, 0.12)", color: "#B45309", fontWeight: 700 }}>
                                  Direct Settled: {pkr(row.taxBreakdown.amount)}
                                </span>
                                <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "var(--bg)", border: "1px solid var(--rule)", color: "var(--ink-muted)" }}>
                                  Vendor: {row.taxBreakdown.vendor} {row.taxBreakdown.instrumentNo ? `[#${row.taxBreakdown.instrumentNo}]` : ""}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </td>
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

  if (isModal) {
    return (
      <div className="modal-backdrop" style={{ zIndex: 1150, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", padding: "16px" }} onClick={onClose}>
        <div className="modal" style={{ width: 1320, maxWidth: "96vw", maxHeight: "94vh", display: "flex", flexDirection: "column", padding: 0, borderRadius: 16, background: "var(--card-bg, #FFFFFF)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)", border: "1px solid #E2E8F0", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
          {/* MODAL HEADER */}
          <div style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #0284C7, #0369A1)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(2, 132, 199, 0.35)" }}>
                <Building2 size={22} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                    {selectedClient?.companyName || selectedClient?.name || "Client Statement"}
                  </h3>
                  <span style={{ background: "#0284C7", color: "#FFFFFF", padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                    {selectedClient?.clientCode || selectedClient?.id}
                  </span>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94A3B8" }}>
                  Client Statement &amp; Accounts Receivable Sub-Ledger &middot; Period: <strong>{dateFrom}</strong> to <strong>{dateTo}</strong>
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button className="btn" onClick={() => setShowPrintModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, background: "linear-gradient(135deg, #0284C7, #0369A1)", borderColor: "#0284C7", color: "#FFFFFF", cursor: "pointer" }}>
                <Printer size={15} /> Print Preview &amp; Printout
              </button>
              <button className="btn" onClick={handleExportExcel} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, background: "#059669", borderColor: "#059669", color: "#FFFFFF", cursor: "pointer" }}>
                <Download size={15} /> Export Excel
              </button>
              <button 
                type="button" 
                onClick={onClose}
                style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#94A3B8", width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#FFFFFF"; e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* MODAL BODY */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", background: "var(--bg, #F8FAFC)" }}>
            {mainContent}
          </div>
        </div>
      </div>
    );
  }

  return mainContent;
}
