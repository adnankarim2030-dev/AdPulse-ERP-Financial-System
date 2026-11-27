import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  const hasBarter = Boolean(statementData.hasBarterActivity);
  const colCount = hasBarter ? 10 : 7;

  let rowsHtml = `
    <tr>
      <td style="border: 1px solid #CBD5E1; padding: 6px; font-family: monospace; text-align: center;">${dateFrom}</td>
      <td style="border: 1px solid #CBD5E1; padding: 6px; font-family: monospace; font-weight: bold; text-align: center;">${statementData.openingRef || "OB-000"}</td>
      <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center;">Opening Balance</td>
      <td style="border: 1px solid #CBD5E1; padding: 6px;">${statementData.openingLabel || "—"}</td>
      <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right;">—</td>
      <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right;">—</td>
      <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; mso-number-format:'\\#\\,\\#\\#0';">${statementData.cashOpening !== undefined ? statementData.cashOpening : statementData.openingBalance}</td>
      ${hasBarter ? `
      <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right;">—</td>
      <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right;">—</td>
      <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: #0F766E; mso-number-format:'\\#\\,\\#\\#0';">${statementData.barterOpening || 0}</td>
      ` : ""}
    </tr>
  `;

  statementData.rows.forEach((r, idx) => {
    const bg = idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC";
    const cDr = r.cashDebit !== undefined ? r.cashDebit : r.debit;
    const cCr = r.cashCredit !== undefined ? r.cashCredit : r.credit;
    const cBal = r.cashRunningBalance !== undefined ? r.cashRunningBalance : r.runningBalance;
    const bDr = r.barterDebit || 0;
    const bCr = r.barterCredit || 0;
    const bBal = r.barterRunningBalance || 0;
    rowsHtml += `
      <tr style="background-color: ${bg};">
        <td style="border: 1px solid #CBD5E1; padding: 6px; font-family: monospace; text-align: center;">${r.date}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px; font-family: monospace; font-weight: bold; text-align: center;">${r.ref}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-weight: bold; color: ${r.type === 'Invoice' ? '#0284C7' : r.type === 'Barter Settlement' ? '#0F766E' : '#059669'};">${r.type}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px;">${r.project || 'General'}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; color: #0284C7; mso-number-format:'\\#\\,\\#\\#0';">${cDr > 0 ? cDr : '—'}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; color: #059669; mso-number-format:'\\#\\,\\#\\#0';">${cCr > 0 ? cCr : '—'}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: ${cBal > 0 ? '#0284C7' : '#059669'}; mso-number-format:'\\#\\,\\#\\#0';">${cBal}</td>
        ${hasBarter ? `
        <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; color: #0F766E; mso-number-format:'\\#\\,\\#\\#0';">${bDr > 0 ? bDr : '—'}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; color: #059669; mso-number-format:'\\#\\,\\#\\#0';">${bCr > 0 ? bCr : '—'}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right; font-weight: bold; color: #0F766E; mso-number-format:'\\#\\,\\#\\#0';">${bBal}</td>
        ` : ""}
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
          <td colspan="${colCount}" style="font-size: 16pt; font-weight: bold; color: #1E293B; padding-bottom: 4px;">AdPulse IMC (Private) Ltd</td>
        </tr>
        <tr>
          <td colspan="${colCount}" style="font-size: 12pt; font-weight: bold; color: #0284C7; padding-bottom: 12px;">CLIENT STATEMENT / ACCOUNTS RECEIVABLE SUB-LEDGER${hasBarter ? " (CASH + BARTER SPLIT)" : ""}</td>
        </tr>
        <tr style="background-color: #F8FAFC;">
          <td colspan="4" style="border: 1px solid #CBD5E1; padding: 6px;"><b>Client:</b> ${cName} (${client.clientCode || client.id})</td>
          <td colspan="${colCount - 4}" style="border: 1px solid #CBD5E1; padding: 6px;"><b>Statement Period:</b> ${dateFrom} to ${dateTo}</td>
        </tr>
        <tr style="background-color: #F8FAFC;">
          <td colspan="4" style="border: 1px solid #CBD5E1; padding: 6px;"><b>Contact:</b> ${client.contactPerson || 'N/A'} | ${client.phone || 'N/A'}</td>
          <td colspan="${colCount - 4}" style="border: 1px solid #CBD5E1; padding: 6px;"><b>Address:</b> ${client.address || 'Karachi, Pakistan'}</td>
        </tr>
        <tr><td colspan="${colCount}" style="height: 14px;"></td></tr>
        <tr style="background-color: #F1F5F9; font-weight: bold;">
          <td colspan="2" style="border: 1px solid #CBD5E1; padding: 8px; text-align: center;">Cash Outstanding: PKR ${(statementData.closingCashBalance !== undefined ? statementData.closingCashBalance : statementData.closingBalance).toLocaleString()}</td>
          <td colspan="2" style="border: 1px solid #CBD5E1; padding: 8px; text-align: center; color: #0F766E;">Barter Outstanding: PKR ${(statementData.closingBarterBalance || 0).toLocaleString()}</td>
          <td colspan="${colCount - 4}" style="border: 1.5px solid #0284C7; padding: 8px; text-align: center; background-color: #E0F2FE; color: #0369A1;">Total Combined Outstanding: PKR ${statementData.closingBalance.toLocaleString()}</td>
        </tr>
        <tr><td colspan="${colCount}" style="height: 14px;"></td></tr>
        <tr style="background-color: #0F172A; color: #FFFFFF; font-weight: bold; text-align: center;">
          <th style="border: 1px solid #000; padding: 8px; width: 100px;">Date</th>
          <th style="border: 1px solid #000; padding: 8px; width: 110px;">Reference</th>
          <th style="border: 1px solid #000; padding: 8px; width: 120px;">Type</th>
          <th style="border: 1px solid #000; padding: 8px; width: 210px;">Project / Scope</th>
          <th style="border: 1px solid #000; padding: 8px; width: 125px; text-align: right;">Cash Debit (PKR)</th>
          <th style="border: 1px solid #000; padding: 8px; width: 125px; text-align: right;">Cash Credit (PKR)</th>
          <th style="border: 1px solid #000; padding: 8px; width: 135px; text-align: right;">Cash Balance (PKR)</th>
          ${hasBarter ? `
          <th style="border: 1px solid #000; padding: 8px; width: 125px; text-align: right; background-color: #0F766E;">Barter Debit (PKR)</th>
          <th style="border: 1px solid #000; padding: 8px; width: 125px; text-align: right; background-color: #0F766E;">Barter Credit (PKR)</th>
          <th style="border: 1px solid #000; padding: 8px; width: 135px; text-align: right; background-color: #0F766E;">Barter Balance (PKR)</th>
          ` : ""}
        </tr>
        ${rowsHtml}
        <tr style="background-color: #0F172A; color: #FFFFFF; font-weight: bold;">
          <td colspan="4" style="border: 1px solid #000; padding: 8px;">Closing Balance Summary</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #38BDF8; mso-number-format:'\\#\\,\\#\\#0';">${statementData.totalCashInvoiced !== undefined ? statementData.totalCashInvoiced : statementData.totalInvoiced}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #34D399; mso-number-format:'\\#\\,\\#\\#0';">${statementData.totalCashCredits !== undefined ? statementData.totalCashCredits : statementData.totalReceived}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #BAE6FD; font-size: 12pt; mso-number-format:'\\#\\,\\#\\#0';">${statementData.closingCashBalance !== undefined ? statementData.closingCashBalance : statementData.closingBalance}</td>
          ${hasBarter ? `
          <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #5EEAD4; mso-number-format:'\\#\\,\\#\\#0';">${statementData.totalBarterInvoiced || 0}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #34D399; mso-number-format:'\\#\\,\\#\\#0';">${statementData.totalBarterSettled || 0}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #99F6E4; font-size: 12pt; mso-number-format:'\\#\\,\\#\\#0';">${statementData.closingBarterBalance || 0}</td>
          ` : ""}
        </tr>
        ${(statementData.pdcSummary?.pendingCount || 0) > 0 ? `
        <tr><td colspan="${colCount}" style="height: 8px;"></td></tr>
        <tr style="background-color: #FEF3C7; font-weight: bold;">
          <td colspan="${colCount - 1}" style="border: 1px solid #B45309; padding: 7px 8px; text-align: right; color: #92400E;">
            Less: Pending Client PDC Cheques In-Hand (${statementData.pdcSummary.pendingCount} Chq${statementData.pdcSummary.pendingCount > 1 ? "s" : ""} — Not Yet Deducted from Ledger)
          </td>
          <td style="border: 1px solid #B45309; padding: 7px 8px; text-align: right; color: #B45309; mso-number-format:'\\#\\,\\#\\#0';">-${statementData.pdcSummary.pendingTotal || 0}</td>
        </tr>
        <tr style="background-color: #ECFDF5; font-weight: bold;">
          <td colspan="${colCount - 1}" style="border: 1.5px solid #059669; padding: 8px; text-align: right; color: #065F46; font-size: 11.5pt;">
            NET PROJECTED RECEIVABLE BALANCE AFTER PDC CLEARANCE
          </td>
          <td style="border: 1.5px solid #059669; padding: 8px; text-align: right; color: ${(statementData.closingBalance - (statementData.pdcSummary.pendingTotal || 0)) > 0 ? "#0369A1" : "#059669"}; font-size: 12pt; mso-number-format:'\\#\\,\\#\\#0';">${statementData.closingBalance - (statementData.pdcSummary.pendingTotal || 0)}</td>
        </tr>
        ` : ""}
        <tr><td colspan="${colCount}" style="height: 18px;"></td></tr>
        <tr>
          <td colspan="${colCount}" style="font-size: 10pt; font-style: italic; color: #64748B;">Generated from AdPulse Financial Management System on ${new Date().toLocaleDateString()}</td>
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

const PAGE_SIZES = {
  A4: "210mm 297mm",
  Letter: "8.5in 11in",
  Legal: "8.5in 14in"
};

function pageContentHeightMm(pageSize, orientation, marginStr) {
  const raw = PAGE_SIZES[pageSize] || PAGE_SIZES.A4;
  const [wRaw, hRaw] = raw.split(" ");
  const toMm = v => (v.endsWith("in") ? parseFloat(v) * 25.4 : parseFloat(v));
  let w = toMm(wRaw), h = toMm(hRaw);
  if (orientation === "landscape") { const t = w; w = h; h = t; }
  const margin = parseFloat(marginStr) || 0;
  return Math.max(h - margin * 2, 40);
}

export function ClientStatementPrintModal({ client, dateFrom, dateTo, statementData, onClose }) {
  const [pageSize, setPageSize] = useState("A4");
  const [pageOrientation, setPageOrientation] = useState("portrait");
  const [pageMargin, setPageMargin] = useState("8mm");
  const [printScale, setPrintScale] = useState("100%");
  const printRef = useRef(null);

  const pkr = (val) => "PKR " + (Number(val) || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtDate = (d) => {
    if (!d) return "—";
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return d;
    }
  };

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

  const printAreaHeightMm = pageContentHeightMm(pageSize, pageOrientation, pageMargin);
  const printScaleFactor = parseInt(printScale) / 100;
  const printAreaScaledHeightMm = printAreaHeightMm / printScaleFactor;

  const modalContent = (
    <div className="modal-backdrop statement-print-portal" style={{ zIndex: 99999 }} onClick={onClose}>
      <style>{`
        @page {
          size: ${pageSize} ${pageOrientation};
          margin: ${pageMargin};
        }
        .statement-print-portal .print-area table {
          width: 100% !important;
          max-width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
          border: 1px solid #000000 !important;
        }
        .statement-print-portal .print-area th {
          font-size: 9px !important;
          padding: 5px 4px !important;
          text-align: center !important;
          vertical-align: middle !important;
          font-weight: 700 !important;
          background: #FFFFFF !important;
          color: #000000 !important;
          border: 1px solid #000000 !important;
          text-transform: uppercase !important;
        }
        .statement-print-portal .print-area td {
          font-size: 9px !important;
          padding: 4px 5px !important;
          vertical-align: middle !important;
          border: 1px solid #000000 !important;
          color: #000000 !important;
          word-break: break-word !important;
        }
        @media print {
          *, *::before, *::after {
            box-shadow: none !important;
            text-shadow: none !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            height: auto !important;
            width: 100% !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #root {
            display: none !important;
          }
          .statement-print-portal {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }
          .statement-print-portal .no-print-header,
          .statement-print-portal .no-print,
          .statement-print-portal button {
            display: none !important;
          }
          .statement-print-portal .modal {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            background: #ffffff !important;
          }
          .statement-print-portal .print-wrapper {
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            display: block !important;
          }
          .statement-print-portal .print-area {
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            padding: 4px 6px !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            transform: scale(${printScaleFactor});
            transform-origin: top left;
            width: ${100 / printScaleFactor}% !important;
            max-width: ${100 / printScaleFactor}% !important;
            min-height: ${printAreaScaledHeightMm - 4}mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          .statement-print-portal .print-area thead {
            display: table-header-group !important;
          }
          .statement-print-portal .print-area tfoot {
            display: table-footer-group !important;
          }
          .statement-print-portal .print-area tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .statement-print-portal .print-signatures,
          .statement-print-portal .invoice-footer-banner {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .statement-print-portal .invoice-footer-banner {
            background: #A81C1C !important;
            background-image: linear-gradient(90deg, #A81C1C 0%, #1D3B4E 100%) !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            display: flex !important;
            visibility: visible !important;
            margin-top: 10px !important;
          }
        }
      `}</style>
      <div className="modal" style={{ width: 960, maxWidth: "98vw", maxHeight: "94vh", overflowY: "auto", background: "var(--card-bg, #0F172A)", borderRadius: 12, border: "1px solid #334155" }} onClick={e => e.stopPropagation()}>
        {/* MODAL TOP TOOLBAR */}
        <div className="no-print-header" style={{ background: "#1E293B", padding: "12px 18px", borderBottom: "1px solid #334155", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: "#38BDF8", display: "flex", alignItems: "center", gap: 6 }}>
              <FileText size={18} /> Official Statement Print Preview (Invoice Format)
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

        {/* PRINTABLE AREA CONTAINER (A4 Paper Box - Official Invoice Style) */}
        <div className="print-wrapper" style={{ padding: "20px", display: "flex", justifyContent: "center", background: "#334155" }}>
          <div ref={printRef} className="print-area" style={{ background: "#ffffff", color: "#000000", width: "100%", maxWidth: "820px", minHeight: "272mm", padding: "18px 22px", fontFamily: "'Calibri', 'Inter', sans-serif", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box", boxShadow: "0 8px 24px rgba(0,0,0,0.25)", borderRadius: 2 }}>
            <div>
              {/* 1. HEADER SECTION (Matches Official Invoice Layout) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 12, borderBottom: "1px solid #000000", paddingBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img src="./logo.png" alt="AdPulse Logo" style={{ height: 68, maxHeight: 72, width: "auto", objectFit: "contain" }} onError={(e) => { e.target.style.display = 'none'; }} />
                </div>

                <div style={{ textAlign: "center", padding: "0 10px" }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.4px", color: "#000000", textDecoration: "underline" }}>
                    CLIENT STATEMENT OF ACCOUNT
                  </h2>
                  <div style={{ fontSize: 8.5, color: "#000000", marginTop: 3, fontWeight: 700 }}>
                    AdPulse IMC (Private) Ltd | SRB # S9940258-8 | NTN # 9940258-8
                  </div>
                </div>

                <div style={{ textAlign: "right", fontSize: 9.5, lineHeight: 1.4, color: "#000000" }}>
                  <div><b>DATE:</b> {fmtDate(new Date().toISOString().slice(0, 10))}</div>
                  <div><b>STATEMENT NO:</b> STMT-{(client.clientCode || client.id || "").toUpperCase()}</div>
                  <div><b>PERIOD:</b> {fmtDate(dateFrom)} to {fmtDate(dateTo)}</div>
                </div>
              </div>

              {/* 2. CLIENT DETAILS STRIP (Matches Invoice Black Bordered Info Strip) */}
              <div style={{ border: "1px solid #000000", padding: "6px 10px", marginBottom: 10, display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 8, fontSize: 9.5, color: "#000000", lineHeight: 1.4 }}>
                <div>
                  <div><b>CLIENT / PARTY:</b> <span style={{ fontWeight: 700 }}>{client.companyName || client.name}</span> ({client.clientCode || client.id})</div>
                  <div><b>CONTACT PERSON:</b> {client.contactPerson || "N/A"} {client.phone ? `(${client.phone})` : ""}</div>
                </div>
                <div>
                  <div><b>ADDRESS:</b> {client.address || "Karachi, Pakistan"}</div>
                  <div><b>PAYMENT TERMS:</b> {client.paymentTerms || "Net 30"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div><b>NTN / STRN:</b> {client.ntn || "N/A"} {client.strn ? `/ ${client.strn}` : ""}</div>
                  <div><b>CLOSING RECEIVABLE:</b> <span style={{ fontWeight: 800 }}>{pkr(statementData.closingBalance)}</span></div>
                </div>
              </div>

              {/* 3. SUMMARY METRIC BOXES (Crisp Black Borders) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10 }}>
                <div style={{ border: "1px solid #000000", padding: "5px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "#000000" }}>OPENING BALANCE</div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#000000", marginTop: 2 }}>{pkr(statementData.openingBalance)}</div>
                </div>
                <div style={{ border: "1px solid #000000", padding: "5px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "#000000" }}>TOTAL INVOICED (+)</div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#000000", marginTop: 2 }}>{pkr(statementData.totalInvoiced)}</div>
                </div>
                <div style={{ border: "1px solid #000000", padding: "5px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "#000000" }}>TOTAL SETTLED (-)</div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#000000", marginTop: 2 }}>{pkr(statementData.totalCredits !== undefined ? statementData.totalCredits : statementData.totalReceived)}</div>
                </div>
                <div style={{ border: "1.5px solid #000000", padding: "5px 8px", textAlign: "center", background: "#F8FAFC" }}>
                  <div style={{ fontSize: 8, fontWeight: 800, textTransform: "uppercase", color: "#000000" }}>CLOSING OUTSTANDING</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#000000", marginTop: 2 }}>{pkr(statementData.closingBalance)}</div>
                </div>
              </div>

              {/* TAX BREAKDOWN BANNER */}
              {(statementData.totalGrossInvoiced > 0 || statementData.totalWhtWithheld > 0 || statementData.totalSstWithheld > 0) && (
                <div style={{ display: "flex", justifyContent: "space-between", border: "1px solid #000000", padding: "4px 8px", marginBottom: 10, fontSize: 8.5, color: "#000000" }}>
                  <span><b>Gross Invoiced:</b> {pkr(statementData.totalGrossInvoiced)}</span>
                  <span><b>Output SST (SRB/PRA):</b> {pkr(statementData.totalSstInvoiced)}</span>
                  <span><b>WHT Withheld (FBR):</b> {pkr(statementData.totalWhtWithheld)}</span>
                  <span><b>SST Withheld:</b> {pkr(statementData.totalSstWithheld)}</span>
                  <span><b>Net Cash Received:</b> {pkr(statementData.totalReceived)}</span>
                </div>
              )}

              {/* 3.5. PDC CHEQUE STATUS TABLE IN PRINTOUT (ONLY SHOWS UN-CLEARED / PENDING PDCs; CLEARED PDCs MOVE TO MAIN LEDGER) */}
              {(() => {
                const unclearedPrintPdcs = (statementData.pdcSummary?.rows || []).filter(p => p.status !== "Cleared");
                if (unclearedPrintPdcs.length === 0) return null;
                return (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    PENDING POST-DATED CHEQUES (PDC) — In-Hand: {pkr(statementData.pdcSummary.pendingTotal)} (Not Deducted Yet)
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 8.5, border: "1px solid #000000", tableLayout: "fixed" }}>
                    <thead>
                      <tr>
                        <th style={{ width: "15%" }}>VOUCHER #</th>
                        <th style={{ width: "14%" }}>MATURITY DATE</th>
                        <th style={{ width: "16%" }}>CHEQUE #</th>
                        <th style={{ width: "20%" }}>DRAWN BANK</th>
                        <th style={{ width: "16%", textAlign: "right" }}>AMOUNT (PKR)</th>
                        <th style={{ width: "19%" }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unclearedPrintPdcs.map((pdc, pIdx) => (
                        <tr key={pIdx}>
                          <td style={{ textAlign: "center", fontFamily: "monospace", fontWeight: 700 }}>{pdc.voucherNo}</td>
                          <td style={{ textAlign: "center" }}>{fmtDate(pdc.maturityDate)}</td>
                          <td style={{ textAlign: "center", fontFamily: "monospace" }}>#{pdc.chequeNo}</td>
                          <td>{pdc.drawnBank}</td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>{pkr(pdc.amount)}</td>
                          <td style={{ textAlign: "center", fontWeight: 700 }}>
                            {pdc.status === "Bounced" ? "BOUNCED" : "IN-HAND (PENDING)"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                );
              })()}

              {/* 4. TRANSACTIONS TABLE (Matches Official Invoice Table Grid — Dual Cash + Barter Columns when Barter active) */}
              {(() => {
                const printBarter = Boolean(statementData.hasBarterActivity);
                return (
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10, fontSize: printBarter ? 8 : 9, border: "1px solid #000000", tableLayout: "fixed" }}>
                <thead>
                  {printBarter ? (
                    <>
                      <tr>
                        <th rowSpan={2} style={{ width: "4%", border: "1px solid #000000", padding: "4px 2px", textAlign: "center" }}>#</th>
                        <th rowSpan={2} style={{ width: "9%", border: "1px solid #000000", padding: "4px 2px", textAlign: "center" }}>DATE</th>
                        <th rowSpan={2} style={{ width: "10%", border: "1px solid #000000", padding: "4px 2px", textAlign: "center" }}>REF NO</th>
                        <th rowSpan={2} style={{ width: "9%", border: "1px solid #000000", padding: "4px 2px", textAlign: "center" }}>TYPE</th>
                        <th rowSpan={2} style={{ width: "18%", border: "1px solid #000000", padding: "4px 4px", textAlign: "left" }}>PARTICULARS</th>
                        <th colSpan={3} style={{ border: "1px solid #000000", padding: "4px 2px", textAlign: "center", background: "#E0F2FE" }}>CASH / BANK LEDGER (PKR)</th>
                        <th colSpan={3} style={{ border: "1px solid #000000", padding: "4px 2px", textAlign: "center", background: "#CCFBF1" }}>BARTER LEDGER (PKR)</th>
                      </tr>
                      <tr>
                        <th style={{ width: "8.3%", border: "1px solid #000000", padding: "3px 2px", textAlign: "right" }}>CASH DR</th>
                        <th style={{ width: "8.3%", border: "1px solid #000000", padding: "3px 2px", textAlign: "right" }}>CASH CR</th>
                        <th style={{ width: "8.4%", border: "1px solid #000000", padding: "3px 2px", textAlign: "right" }}>CASH BAL</th>
                        <th style={{ width: "8.3%", border: "1px solid #000000", padding: "3px 2px", textAlign: "right" }}>BARTER DR</th>
                        <th style={{ width: "8.3%", border: "1px solid #000000", padding: "3px 2px", textAlign: "right" }}>BARTER CR</th>
                        <th style={{ width: "8.4%", border: "1px solid #000000", padding: "3px 2px", textAlign: "right" }}>BARTER BAL</th>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <th style={{ width: "6%", border: "1px solid #000000", padding: "5px 3px", textAlign: "center" }}>S.NO</th>
                      <th style={{ width: "11%", border: "1px solid #000000", padding: "5px 3px", textAlign: "center" }}>DATE</th>
                      <th style={{ width: "13%", border: "1px solid #000000", padding: "5px 3px", textAlign: "center" }}>REF NO</th>
                      <th style={{ width: "12%", border: "1px solid #000000", padding: "5px 3px", textAlign: "center" }}>TYPE</th>
                      <th style={{ width: "22%", border: "1px solid #000000", padding: "5px 5px", textAlign: "left" }}>PROJECT / PARTICULARS</th>
                      <th style={{ width: "12%", border: "1px solid #000000", padding: "4px 4px", textAlign: "right", lineHeight: 1.15 }}>CASH DEBIT<br/>(PKR)</th>
                      <th style={{ width: "12%", border: "1px solid #000000", padding: "4px 4px", textAlign: "right", lineHeight: 1.15 }}>CASH CREDIT<br/>(PKR)</th>
                      <th style={{ width: "12%", border: "1px solid #000000", padding: "4px 4px", textAlign: "right", lineHeight: 1.15 }}>CASH BALANCE<br/>(PKR)</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  <tr style={{ fontWeight: 700, background: "#F8FAFC" }}>
                    <td style={{ border: "1px solid #000000", padding: "4px 3px", textAlign: "center" }}>—</td>
                    <td style={{ border: "1px solid #000000", padding: "4px 3px", textAlign: "center" }}>{fmtDate(dateFrom)}</td>
                    <td style={{ border: "1px solid #000000", padding: "4px 3px", textAlign: "center", fontFamily: "monospace" }}>{statementData.openingRef || "OB-000"}</td>
                    <td style={{ border: "1px solid #000000", padding: "4px 3px", textAlign: "center" }}>Opening B/F</td>
                    <td style={{ border: "1px solid #000000", padding: "4px 5px" }}>{statementData.openingLabel || "Opening Balance Brought Forward"}</td>
                    <td style={{ border: "1px solid #000000", padding: "4px 4px", textAlign: "right" }}>—</td>
                    <td style={{ border: "1px solid #000000", padding: "4px 4px", textAlign: "right" }}>—</td>
                    <td style={{ border: "1px solid #000000", padding: "4px 4px", textAlign: "right", fontWeight: 700 }}>{pkr(statementData.cashOpening !== undefined ? statementData.cashOpening : statementData.openingBalance)}</td>
                    {printBarter && (
                      <>
                        <td style={{ border: "1px solid #000000", padding: "4px 4px", textAlign: "right" }}>—</td>
                        <td style={{ border: "1px solid #000000", padding: "4px 4px", textAlign: "right" }}>—</td>
                        <td style={{ border: "1px solid #000000", padding: "4px 4px", textAlign: "right", fontWeight: 700 }}>{pkr(statementData.barterOpening || 0)}</td>
                      </>
                    )}
                  </tr>

                  {statementData.rows.length === 0 ? (
                    <tr>
                      <td colSpan={printBarter ? 11 : 8} style={{ border: "1px solid #000000", textAlign: "center", padding: 14, color: "#000000" }}>
                        No client statement transactions recorded within this date range.
                      </td>
                    </tr>
                  ) : (
                    statementData.rows.map((row, idx) => {
                      const cDr = row.cashDebit !== undefined ? row.cashDebit : row.debit;
                      const cCr = row.cashCredit !== undefined ? row.cashCredit : row.credit;
                      const cBal = row.cashRunningBalance !== undefined ? row.cashRunningBalance : row.runningBalance;
                      const bDr = row.barterDebit || 0;
                      const bCr = row.barterCredit || 0;
                      const bBal = row.barterRunningBalance || 0;
                      return (
                      <tr key={idx}>
                        <td style={{ border: "1px solid #000000", padding: "4px 3px", textAlign: "center", fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ border: "1px solid #000000", padding: "4px 3px", textAlign: "center" }}>{fmtDate(row.date)}</td>
                        <td style={{ border: "1px solid #000000", padding: "4px 3px", textAlign: "center", fontWeight: 700, fontFamily: "monospace" }}>{row.ref}</td>
                        <td style={{ border: "1px solid #000000", padding: "4px 3px", textAlign: "center", fontWeight: 600 }}>{row.type}</td>
                        <td style={{ border: "1px solid #000000", padding: "4px 5px", wordBreak: "break-word" }}>
                          <div style={{ fontWeight: 700 }}>{row.project}</div>
                          {row.taxBreakdown && row.taxBreakdown.kind === "invoice" && (
                            <div style={{ fontSize: 7.5, color: "#000000", marginTop: 1, lineHeight: 1.2 }}>
                              Gross: {pkr(row.taxBreakdown.gross)} {row.taxBreakdown.sst > 0 ? `| SST (${row.taxBreakdown.sstRate}%): +${pkr(row.taxBreakdown.sst)}` : ""} {row.taxBreakdown.discount > 0 ? `| Disc: -${pkr(row.taxBreakdown.discount)}` : ""} {bDr > 0 ? `| Cash: ${pkr(cDr)} / Barter: ${pkr(bDr)}` : ""}
                            </div>
                          )}
                          {row.taxBreakdown && (row.taxBreakdown.kind === "receipt" || row.taxBreakdown.kind === "receipt_net") && (
                            <div style={{ fontSize: 7.5, color: "#000000", marginTop: 1, lineHeight: 1.2 }}>
                              Gross Settled: {pkr(row.taxBreakdown.gross)} {row.taxBreakdown.wht > 0 ? `| WHT (${row.taxBreakdown.whtRate}%): -${pkr(row.taxBreakdown.wht)}` : ""} {row.taxBreakdown.sst > 0 ? `| SST Withheld (${row.taxBreakdown.sstRate}%): -${pkr(row.taxBreakdown.sst)}` : ""} | Net Rec: {pkr(row.taxBreakdown.net)} {row.taxBreakdown.mode ? `[${row.taxBreakdown.mode}${row.taxBreakdown.instrumentNo ? ` #${row.taxBreakdown.instrumentNo}` : ""}]` : ""}
                            </div>
                          )}
                          {row.taxBreakdown && row.taxBreakdown.kind === "tax_deduction" && (
                            <div style={{ fontSize: 7.5, color: "#000000", marginTop: 1, lineHeight: 1.2 }}>
                              {row.taxBreakdown.taxType} Withheld Against {row.taxBreakdown.parentRef} ({row.taxBreakdown.rate}%): {pkr(row.taxBreakdown.amount)}
                            </div>
                          )}
                          {row.taxBreakdown && row.taxBreakdown.kind === "direct_settlement" && (
                            <div style={{ fontSize: 7.5, color: "#000000", marginTop: 1, lineHeight: 1.2 }}>
                              Direct Settled: {pkr(row.taxBreakdown.amount)} {row.taxBreakdown.mode ? `[${row.taxBreakdown.mode}${row.taxBreakdown.instrumentNo ? ` #${row.taxBreakdown.instrumentNo}` : ""}]` : ""}
                            </div>
                          )}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 3px", textAlign: "right", fontWeight: cDr > 0 ? 700 : 400 }}>
                          {cDr > 0 ? pkr(cDr) : "—"}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 3px", textAlign: "right", fontWeight: cCr > 0 ? 700 : 400 }}>
                          {cCr > 0 ? pkr(cCr) : "—"}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 3px", textAlign: "right", fontWeight: 700 }}>
                          {pkr(cBal)}
                        </td>
                        {printBarter && (
                          <>
                            <td style={{ border: "1px solid #000000", padding: "4px 3px", textAlign: "right", fontWeight: bDr > 0 ? 700 : 400 }}>
                              {bDr > 0 ? pkr(bDr) : "—"}
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "4px 3px", textAlign: "right", fontWeight: bCr > 0 ? 700 : 400 }}>
                              {bCr > 0 ? pkr(bCr) : "—"}
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "4px 3px", textAlign: "right", fontWeight: 700 }}>
                              {pkr(bBal)}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                    })
                  )}

                  {/* SUMMARY ROWS */}
                  <tr>
                    <td colSpan={5} style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "right", fontWeight: 700 }}>PERIOD TOTALS</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 3px", textAlign: "right", fontWeight: 700 }}>{pkr(statementData.totalCashInvoiced !== undefined ? statementData.totalCashInvoiced : statementData.totalInvoiced)}</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 3px", textAlign: "right", fontWeight: 700 }}>{pkr(statementData.totalCashCredits !== undefined ? statementData.totalCashCredits : statementData.totalReceived)}</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 3px", textAlign: "right", fontWeight: 700 }}>{pkr(statementData.closingCashBalance !== undefined ? statementData.closingCashBalance : statementData.closingBalance)}</td>
                    {printBarter && (
                      <>
                        <td style={{ border: "1px solid #000000", padding: "5px 3px", textAlign: "right", fontWeight: 700 }}>{pkr(statementData.totalBarterInvoiced || 0)}</td>
                        <td style={{ border: "1px solid #000000", padding: "5px 3px", textAlign: "right", fontWeight: 700 }}>{pkr(statementData.totalBarterSettled || 0)}</td>
                        <td style={{ border: "1px solid #000000", padding: "5px 3px", textAlign: "right", fontWeight: 700 }}>{pkr(statementData.closingBarterBalance || 0)}</td>
                      </>
                    )}
                  </tr>
                  <tr>
                    <td colSpan={printBarter ? 10 : 7} style={{ border: "1px solid #000000", padding: "6px 6px", textAlign: "right", fontWeight: 700, fontSize: 10 }}>
                      NET COMBINED CLOSING RECEIVABLE BALANCE {printBarter ? `(Cash: ${pkr(statementData.closingCashBalance)} + Barter: ${pkr(statementData.closingBarterBalance)})` : ""}
                    </td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", textAlign: "right", fontWeight: 800, fontSize: 10.5 }}>{pkr(statementData.closingBalance)}</td>
                  </tr>
                </tbody>
              </table>
                );
              })()}

              {/* 4B. PDC RECONCILIATION — PROJECTED RECEIVABLE AFTER PENDING PDCs */}
              {(statementData.pdcSummary?.pendingCount || 0) > 0 && (
                <div style={{ marginBottom: 8, border: "1.5px solid #000000", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ background: "#FEF3C7", padding: "4px 8px", fontSize: 8.5, fontWeight: 800, color: "#92400E", borderBottom: "1px solid #000000", textTransform: "uppercase" }}>
                    POST-DATED CHEQUES (PDC) RECONCILIATION — PROJECTED RECEIVABLE SUMMARY
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "#FFFFFF" }}>
                    <div style={{ padding: "5px 8px", borderRight: "1px solid #000000", textAlign: "center" }}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: "#000000", textTransform: "uppercase" }}>CLOSING LEDGER RECEIVABLE</div>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: "#000000", marginTop: 2 }}>{pkr(statementData.closingBalance)}</div>
                    </div>
                    <div style={{ padding: "5px 8px", borderRight: "1px solid #000000", textAlign: "center", background: "#FFFBEB" }}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: "#92400E", textTransform: "uppercase" }}>LESS: PENDING PDCs IN-HAND ({statementData.pdcSummary.pendingCount} CHQ{statementData.pdcSummary.pendingCount > 1 ? "S" : ""})</div>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: "#B45309", marginTop: 2 }}>− {pkr(statementData.pdcSummary.pendingTotal)}</div>
                    </div>
                    <div style={{ padding: "5px 8px", textAlign: "center", background: "#ECFDF5" }}>
                      <div style={{ fontSize: 8, fontWeight: 800, color: "#065F46", textTransform: "uppercase" }}>NET PROJECTED RECEIVABLE AFTER PDC</div>
                      <div style={{ fontSize: 11, fontWeight: 900, color: "#065F46", marginTop: 2 }}>{pkr(statementData.closingBalance - (statementData.pdcSummary.pendingTotal || 0))}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. AMOUNT IN WORDS & SPECIAL NOTES (Matches Official Invoice Footer Sections) */}
              <div style={{ border: "1px solid #000000", padding: "6px 10px", marginBottom: 8, fontSize: 9.5, color: "#000000" }}>
                <b>Amount in words:</b> <i>{amountInWords(statementData.closingBalance)}</i>
              </div>

              <div style={{ border: "1px solid #000000", padding: "6px 10px", fontSize: 9, lineHeight: 1.4, color: "#000000" }}>
                <div style={{ fontWeight: 700, textDecoration: "underline", marginBottom: 2 }}>Special Notes &amp; Terms:</div>
                <div>1. Please make all cheques / pay orders &amp; online transfers in favour of <b>"AdPulse IMC (Private) Ltd"</b>.</div>
                <div>2. Please provide Section 153 Withholding Tax (CPR) and SRB/PRA Sales Tax Withholding certificates upon payment.</div>
              </div>
            </div>

            {/* 6. BOTTOM PINNED: SIGNATURES & FOOTER BANNER */}
            <div className="print-signatures" style={{ marginTop: "auto", paddingTop: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10, fontSize: 9.5, fontWeight: 700, color: "#000000" }}>
                <div style={{ textAlign: "center", width: 170 }}>
                  <div style={{ borderTop: "1px solid #000000", paddingTop: 4 }}>PREPARED BY</div>
                </div>
                <div style={{ textAlign: "center", width: 170 }}>
                  <div style={{ borderTop: "1px solid #000000", paddingTop: 4 }}>ACCOUNTS MANAGER</div>
                </div>
                <div style={{ textAlign: "center", width: 170 }}>
                  <div style={{ borderTop: "1px solid #000000", paddingTop: 4 }}>AUTHORIZED SIGNATORY</div>
                </div>
              </div>

              {/* FOOTER BANNER */}
              <div className="invoice-footer-banner" style={{ background: "#A81C1C", backgroundImage: "linear-gradient(90deg, #A81C1C 0%, #1D3B4E 100%)", color: "#FFFFFF", padding: "5px 12px", borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 8.2, fontWeight: 600, boxSizing: "border-box" }}>
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

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
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
  const [showBarterCols, setShowBarterCols] = useState(null); // null = auto (shows when client has barter), true/false = manual override

  useEffect(() => {
    if (selectedClientId) {
      setActiveClientId(selectedClientId);
      setSelectedProjectId("all");
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
      return { openingBalance: 0, openingRef: "OB-000", openingLabel: "Opening Balance", rows: [], totalInvoiced: 0, totalReceived: 0, totalTaxDeducted: 0, totalCredits: 0, creditNotes: 0, closingBalance: 0 };
    }

    const clientNameNorm = (selectedClient.name || "").toLowerCase().trim();
    const clientCompNorm = (selectedClient.companyName || "").toLowerCase().trim();
    const clientCodeNorm = (selectedClient.clientCode || "").toLowerCase().trim();

    // 1. Calculate Opening Balance (handles both Client Opening Balance and Project-Specific Opening Balance)
    const selectedProjObj = selectedProjectId !== "all" ? clientProjects.find(p => p.id === selectedProjectId) : null;

    // Helper: is transaction related to selected client?
    const isClientMatch = (item) => {
      if (!item || !selectedClient) return false;
      // Direct ID or Code match
      if (item.clientId && (item.clientId === selectedClient.id || item.clientId === clientCodeNorm)) return true;

      // Project association match (if transaction is attached to a project owned by this client)
      if (item.projectId && clientProjects.some(p => p.id === item.projectId)) return true;
      if (item.project && clientProjects.some(p => p.name && p.name.toLowerCase() === item.project.toLowerCase())) return true;

      // Client name string matching
      const iClient = (item.client || "").toLowerCase().trim();
      if (iClient && (iClient === clientNameNorm || iClient === clientCompNorm)) return true;

      // Counterparty string matching (bidirectional so "GFS", "GFS - MTR" matches "GFS BUILDERS & DEVELOPERS" and vice-versa)
      const iParty = (item.party || "").toLowerCase().trim();
      if (iParty) {
        if (iParty === clientNameNorm || iParty === clientCompNorm) return true;
        if (iParty.includes(clientNameNorm) || (clientCompNorm && iParty.includes(clientCompNorm))) return true;
        if (iParty.length >= 3 && (clientNameNorm.startsWith(iParty) || clientNameNorm.includes(iParty) || (clientCompNorm && clientCompNorm.includes(iParty)))) return true;
      }
      return false;
    };

    // Helper: is transaction related to selected project?
    const isProjectMatch = (item) => {
      if (selectedProjectId === "all") return true;
      if (item.projectId === selectedProjectId) return true;
      if (selectedProjObj) {
        if (item.project && item.project.toLowerCase() === selectedProjObj.name.toLowerCase()) return true;
        const pNameClean = selectedProjObj.name.toLowerCase().replace(/^(gfs\s+)/i, "").trim();
        const desc = (item.description || "").toLowerCase();
        const party = (item.party || "").toLowerCase();
        if (pNameClean.length >= 4 && (desc.includes(pNameClean) || party.includes(pNameClean))) return true;
      }
      return false;
    };
    const clientOp = Number(selectedClient.openingBalance) || 0;
    const clientBarterOp = selectedProjectId === "all" ? (Number(selectedClient.openingBarterBalance) || 0) : 0;
    const projectsOpTotal = clientProjects.reduce((s, p) => s + (Number(p.openingBalance) || 0), 0);

    let cashOpening = selectedProjectId !== "all"
      ? (Number(selectedProjObj?.openingBalance) || 0)
      : (clientOp + projectsOpTotal);
    let barterOpening = clientBarterOp;

    const openingRef = selectedProjObj ? `OB-${selectedProjObj.projectCode || "PRJ"}` : "OB-000";
    const openingLabel = selectedProjObj
      ? `${selectedProjObj.name} — Project Opening Balance`
      : projectsOpTotal > 0
      ? `Opening Balance (Client: PKR ${clientOp.toLocaleString("en-US")} + Projects: PKR ${projectsOpTotal.toLocaleString("en-US")})`
      : "Opening Balance Brought Forward";

    // Prior Invoices before dateFrom (split into Cash vs Barter portions)
    const priorInvoices = invoices.filter(i => isClientMatch(i) && isProjectMatch(i) && i.issueDate < dateFrom);
    priorInvoices.forEach(inv => {
      const tot = Number(inv.totalAmount || inv.amount) || 0;
      const bAmt = (inv.applyBarter && Number(inv.barterAmount) > 0) ? Math.min(tot, Number(inv.barterAmount)) : 0;
      const cAmt = Math.max(0, tot - bAmt);
      cashOpening += cAmt;
      barterOpening += bAmt;
    });

    // Prior Receipts / Vouchers / Direct Settlements / Client Barter / Client Refund PVs before dateFrom
    // IMPORTANT: Unpaid / Uncleared PDC cheques (pdcStatus !== "Cleared") MUST NOT affect Client Balance!
    const isClientPvVoucher = (v) => v.type === "PV" && (v.payeeType === "client" || (Boolean(v.clientId) && !v.vendorId));
    const priorVouchers = vouchers.filter(v => isClientMatch(v) && isProjectMatch(v) && v.date < dateFrom && (v.type === "RV" || v.type === "CV" || isClientPvVoucher(v) || (v.type === "BV" && v.barterDirection !== "vendor")) && !(v.isPdc && v.pdcStatus !== "Cleared"));
    priorVouchers.forEach(v => {
      const amt = Number(v.amount) || 0;
      if (v.type === "BV") {
        barterOpening -= amt;
      } else if (v.type === "PV") {
        cashOpening += amt;
      } else {
        cashOpening -= amt;
      }
    });

    const opening = cashOpening + barterOpening;

    // 2. Filter Statement Transactions within [dateFrom, dateTo]
    const rawRows = [];

    // Add Invoices (split into Cash Debit + Barter Debit if Apply Barter is checked; otherwise 100% Cash Debit!)
    invoices.filter(i => isClientMatch(i) && isProjectMatch(i) && i.issueDate >= dateFrom && i.issueDate <= dateTo).forEach(inv => {
      const proj = projects.find(p => p.id === inv.projectId);
      const gross = Number(inv.subtotal || (Number(inv.totalAmount || inv.amount || 0) - Number(inv.tax || inv.salesTax || 0) + Number(inv.discount || 0))) || Number(inv.totalAmount || inv.amount) || 0;
      const discount = Number(inv.discount) || 0;
      const comm = Number(inv.agencyCommission || inv.commission) || 0;
      const sst = Number(inv.tax || inv.salesTax || inv.sstAmount) || 0;
      const sstRate = Number(inv.salesTaxRate || inv.taxRate) || (gross > 0 && sst > 0 ? Math.round((sst / gross) * 100) : 0);
      const total = Number(inv.totalAmount || inv.amount) || 0;
      const invBarterAmt = (inv.applyBarter && Number(inv.barterAmount) > 0) ? Math.min(total, Number(inv.barterAmount)) : 0;
      const invCashAmt = Math.max(0, total - invBarterAmt);

      rawRows.push({
        id: inv.id,
        date: inv.issueDate,
        dueDate: inv.dueDate,
        ref: cleanInvoiceNo(inv.invoiceNo || inv.id),
        type: "Invoice",
        project: proj ? proj.name : (inv.description || "General"),
        debit: total,
        credit: 0,
        cashDebit: invCashAmt,
        cashCredit: 0,
        barterDebit: invBarterAmt,
        barterCredit: 0,
        status: inv.paid ? "Paid" : "Outstanding",
        taxBreakdown: {
          kind: "invoice",
          gross,
          discount,
          comm,
          sst,
          sstRate,
          total,
          cashAmount: invCashAmt,
          barterAmount: invBarterAmt,
          barterPercent: inv.barterPercent || (total > 0 && invBarterAmt > 0 ? Number(((invBarterAmt / total) * 100).toFixed(1)) : 0)
        },
        raw: inv
      });
    });

    // Add Receipts / Vouchers / Direct Settlements / Client Barter / Client Refund PVs (splitting Receipt Amount & Tax Deduction into separate lines!)
    // NOTE: Un-cleared / Pending PDC cheques are shown ONLY in the dedicated top "Pending PDC Cheques" box — once Cleared, they move into the main ledger below!
    vouchers.filter(v => isClientMatch(v) && isProjectMatch(v) && v.date >= dateFrom && v.date <= dateTo && (v.type === "RV" || isClientPvVoucher(v) || v.type === "CV" || (v.type === "BV" && v.barterDirection !== "vendor")) && !(v.isPdc && v.pdcStatus !== "Cleared")).forEach(v => {
      const proj = projects.find(p => p.id === v.projectId);
      const isBarter = v.type === "BV";
      const isPdcBounced = Boolean(v.isPdc && v.pdcStatus === "Bounced");
      const isPdcCleared = Boolean(v.isPdc && v.pdcStatus === "Cleared");
      const isPdcPending = Boolean(v.isPdc && !isPdcCleared && !isPdcBounced);
      const isPdcUnsettled = isPdcPending || isPdcBounced;
      // Only deduct from Client Receivable if NOT a PDC, or if the PDC has been Cleared/Paid!
      const isSettledCredit = (v.type === "RV" || v.type === "CV" || isBarter) && !isPdcUnsettled;
      const isClientDebit = v.type === "PV" && !isPdcUnsettled;

      const grossSettled = Number(v.amount) || 0;
      const wht = Number(v.whtAmount) || 0;
      const whtRate = Number(v.whtRate) || 0;
      const sst = Number(v.sstAmount !== undefined ? v.sstAmount : v.sstWithheld) || 0;
      const sstRate = Number(v.sstRate) || 0;
      const netPaid = (v.netAmount !== undefined && v.netAmount !== null && v.netAmount !== "")
        ? Number(v.netAmount)
        : Math.max(0, grossSettled - wht - sst);

      const modeLabel = isBarter ? "Barter / In-Kind" : (v.via === "Cash" ? "Cash" : (v.paymentMode || (v.isPdc ? "Post-Dated Cheque" : "Bank")));
      const instNo = v.instrumentNo || v.chequeNo;
      const refNo = v.voucherNo || ("VCH-" + v.id.toUpperCase());

      let typeLabel = "Receipt";
      if (isBarter) typeLabel = "Barter Settlement";
      else if (v.type === "CV") typeLabel = "Direct Settlement";
      else if (v.isPdc) typeLabel = isPdcBounced ? "Cheque Bounced" : (isPdcCleared ? (v.type === "PV" ? "PDC Paid (Refund)" : "PDC Cleared") : "PDC Pending");
      else if (v.type === "PV") typeLabel = "Client Payment / Refund";

      let defaultDesc = v.description || "Client Transaction";
      if (isBarter) {
        defaultDesc = `Barter / In-Kind Settlement — ${v.barterItem || v.description || "Goods / Property"}`;
      } else if (v.type === "CV") {
        defaultDesc = `Direct Settlement to Vendor (${v.category || v.vendor || "Vendor"})${instNo ? ` [${v.paymentMode || 'Inst'} #${instNo}]` : ""}`;
      } else if (v.isPdc) {
        defaultDesc = isPdcBounced
          ? `PDC Dishonored/Bounced [Chq #${v.chequeNo || 'PDC'}] — PKR ${grossSettled.toLocaleString("en-US")} (${v.bounceReason || 'Return'} — Not Deducted)`
          : isPdcCleared
          ? `Post-Dated Cheque Cleared/Paid [Chq #${v.chequeNo || 'PDC'}]${v.clearedDate ? ` (Cleared: ${v.clearedDate})` : ""}`
          : `Post-Dated Cheque In-Hand [Chq #${v.chequeNo || 'PDC'}] (Due: ${v.chequeDate || v.date}) — PKR ${grossSettled.toLocaleString("en-US")} (Pending Clearance — Not Deducted Yet)`;
      }

      if (v.type === "RV" && isSettledCredit && (wht > 0 || sst > 0)) {
        // Line 1: Net Amount Received in Bank / Cash
        rawRows.push({
          id: `${v.id}-net`,
          date: isPdcCleared && v.clearedDate ? v.clearedDate : v.date,
          ref: refNo,
          type: typeLabel,
          project: `${proj ? proj.name + " — " : ""}Amount Received (${modeLabel}${instNo ? ` #${instNo}` : ""})`,
          debit: 0,
          credit: netPaid,
          status: v.isPdc ? (v.pdcStatus || "Cleared") : (v.status || "Posted"),
          taxBreakdown: {
            kind: "receipt_net",
            gross: grossSettled,
            wht,
            whtRate,
            sst,
            sstRate,
            net: netPaid,
            mode: modeLabel,
            instrumentNo: instNo,
            bank: v.bankAccount || v.bank
          },
          raw: v
        });

        // Line 2: WHT Tax Deducted at Source (separate line)
        if (wht > 0) {
          rawRows.push({
            id: `${v.id}-wht`,
            date: isPdcCleared && v.clearedDate ? v.clearedDate : v.date,
            ref: `${refNo}-WHT`,
            type: "Tax Deduction (WHT)",
            project: `${proj ? proj.name + " — " : ""}Income Tax Deducted at Source — WHT${whtRate ? ` (${whtRate}%)` : ""}`,
            debit: 0,
            credit: wht,
            status: "Tax Withheld",
            taxBreakdown: {
              kind: "tax_deduction",
              taxType: "WHT",
              rate: whtRate,
              amount: wht,
              parentRef: refNo
            },
            raw: v
          });
        }

        // Line 3: SRB SST Tax Deducted at Source (separate line)
        if (sst > 0) {
          rawRows.push({
            id: `${v.id}-sst`,
            date: isPdcCleared && v.clearedDate ? v.clearedDate : v.date,
            ref: `${refNo}-SST`,
            type: "Tax Deduction (SST)",
            project: `${proj ? proj.name + " — " : ""}Sales Tax Withheld at Source — SRB SST${sstRate ? ` (${sstRate}%)` : ""}`,
            debit: 0,
            credit: sst,
            status: "Tax Withheld",
            taxBreakdown: {
              kind: "tax_deduction",
              taxType: "SST",
              rate: sstRate,
              amount: sst,
              parentRef: refNo
            },
            raw: v
          });
        }
      } else {
        let taxBreakdown = null;
        if (v.type === "RV" && isSettledCredit) {
          taxBreakdown = {
            kind: "receipt",
            gross: grossSettled,
            wht: 0,
            whtRate: 0,
            sst: 0,
            sstRate: 0,
            net: grossSettled,
            mode: modeLabel,
            instrumentNo: instNo,
            bank: v.bankAccount || v.bank
          };
        } else if (v.type === "CV") {
          taxBreakdown = {
            kind: "direct_settlement",
            amount: grossSettled,
            mode: v.paymentMode || "Direct Settlement",
            instrumentNo: instNo,
            vendor: v.category || v.vendor || v.party || "Vendor"
          };
        }

        rawRows.push({
          id: v.id,
          date: isPdcCleared && v.clearedDate ? v.clearedDate : v.date,
          ref: refNo,
          type: typeLabel,
          project: proj ? `${proj.name} (${defaultDesc})` : defaultDesc,
          debit: isClientDebit ? grossSettled : 0,
          credit: isSettledCredit ? grossSettled : 0,
          cashDebit: (!isBarter && isClientDebit) ? grossSettled : 0,
          cashCredit: (!isBarter && isSettledCredit) ? grossSettled : 0,
          barterDebit: 0,
          barterCredit: (isBarter && isSettledCredit) ? grossSettled : 0,
          status: v.isPdc ? (isPdcPending ? "Pending Clearance" : v.pdcStatus) : (v.status || "Posted"),
          isPdcPending,
          pdcFaceAmount: v.isPdc ? grossSettled : 0,
          taxBreakdown,
          raw: v
        });
      }
    });

    // Filter by Tx Type if set
    let filteredRows = rawRows;
    if (selectedTxType === "invoice") {
      filteredRows = rawRows.filter(r => r.type === "Invoice");
    } else if (selectedTxType === "receipt") {
      filteredRows = rawRows.filter(r => r.type === "Receipt" || r.type === "Barter Settlement" || r.type === "PDC Cheque" || r.type === "PDC Cleared" || r.type === "PDC Pending" || r.type === "Direct Settlement" || r.type.startsWith("Tax Deduction"));
    }

    // Sort chronologically
    filteredRows.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate Dual Running Balances (Cash Track + Barter Track) and Tax Metrics
    let running = opening;
    let cashRunning = cashOpening;
    let barterRunning = barterOpening;

    let totalInvoiced = 0;
    let totalCashInvoiced = 0;
    let totalBarterInvoiced = 0;
    let totalReceived = 0;
    let totalCashReceived = 0;
    let totalBarter = 0;
    let creditNotes = 0;

    let totalGrossInvoiced = 0;
    let totalSstInvoiced = 0;
    let totalGrossReceived = 0;
    let totalWhtWithheld = 0;
    let totalSstWithheld = 0;

    const rowsWithBalance = filteredRows.map(r => {
      const cDr = r.cashDebit !== undefined ? r.cashDebit : r.debit;
      const cCr = r.cashCredit !== undefined ? r.cashCredit : r.credit;
      const bDr = r.barterDebit || 0;
      const bCr = r.barterCredit || 0;

      cashRunning = cashRunning + cDr - cCr;
      barterRunning = barterRunning + bDr - bCr;
      running = cashRunning + barterRunning;

      if (r.type === "Invoice") {
        totalInvoiced += r.debit;
        totalCashInvoiced += cDr;
        totalBarterInvoiced += bDr;
        if (r.taxBreakdown) {
          totalGrossInvoiced += (r.taxBreakdown.gross || r.debit);
          totalSstInvoiced += (r.taxBreakdown.sst || 0);
        }
      } else if (r.debit > 0) {
        totalInvoiced += r.debit;
        totalCashInvoiced += cDr;
      }
      if ((r.type === "Receipt" || r.type === "Barter Settlement" || r.type === "PDC Cheque" || r.type === "PDC Cleared" || r.type === "Direct Settlement") && r.credit > 0) {
        totalReceived += r.credit;
        totalCashReceived += cCr;
        if (r.type === "Barter Settlement") {
          totalBarter += bCr;
        }
        if (r.taxBreakdown && r.taxBreakdown.kind === "receipt") {
          totalGrossReceived += (r.taxBreakdown.gross || r.credit);
        } else if (r.taxBreakdown && r.taxBreakdown.kind === "receipt_net") {
          totalGrossReceived += (r.taxBreakdown.gross || r.credit);
        }
      }
      if (r.type === "Tax Deduction (WHT)") {
        totalWhtWithheld += cCr;
      }
      if (r.type === "Tax Deduction (SST)") {
        totalSstWithheld += cCr;
      }
      if (r.type === "Credit Note") creditNotes += r.credit;
      return {
        ...r,
        cashDebit: cDr,
        cashCredit: cCr,
        cashRunningBalance: cashRunning,
        barterDebit: bDr,
        barterCredit: bCr,
        barterRunningBalance: barterRunning,
        runningBalance: running
      };
    });

    const totalTaxDeducted = totalWhtWithheld + totalSstWithheld;
    const totalCashCredits = totalCashReceived + totalTaxDeducted;
    const totalCredits = totalReceived + totalTaxDeducted;
    const hasBarterActivity = barterOpening !== 0 || totalBarterInvoiced > 0 || totalBarter > 0;

    // Dedicated PDC Cheque Status Register for this Client (+ selected project)
    const pdcRows = vouchers
      .filter(v => isClientMatch(v) && isProjectMatch(v) && v.isPdc && v.type === "RV")
      .map(v => {
        const proj = projects.find(p => p.id === v.projectId);
        const status = v.pdcStatus === "Cleared" ? "Cleared" : (v.pdcStatus === "Bounced" ? "Bounced" : "In-Hand");
        return {
          id: v.id,
          voucherNo: v.voucherNo || ("VCH-" + v.id.toUpperCase()),
          issueDate: v.date || "—",
          maturityDate: v.chequeDate || v.instrumentDate || v.date || "—",
          clearedDate: v.clearedDate || null,
          chequeNo: v.chequeNo || v.instrumentNo || "PDC",
          drawnBank: v.drawnBank || "—",
          projectName: proj ? proj.name : "General",
          amount: Number(v.amount) || 0,
          netAmount: Number(v.netAmount !== undefined ? v.netAmount : v.amount) || 0,
          status,
          bounceReason: v.bounceReason || ""
        };
      })
      .sort((a, b) => new Date(a.maturityDate) - new Date(b.maturityDate));

    const pdcSummary = {
      rows: pdcRows,
      pendingCount: pdcRows.filter(p => p.status === "In-Hand").length,
      pendingTotal: pdcRows.filter(p => p.status === "In-Hand").reduce((s, p) => s + p.amount, 0),
      clearedCount: pdcRows.filter(p => p.status === "Cleared").length,
      clearedTotal: pdcRows.filter(p => p.status === "Cleared").reduce((s, p) => s + p.amount, 0),
      bouncedCount: pdcRows.filter(p => p.status === "Bounced").length,
      bouncedTotal: pdcRows.filter(p => p.status === "Bounced").reduce((s, p) => s + p.amount, 0)
    };

    return {
      openingBalance: opening,
      cashOpening,
      barterOpening,
      openingRef,
      openingLabel,
      rows: rowsWithBalance,
      totalInvoiced,
      totalCashInvoiced,
      totalBarterInvoiced,
      totalReceived,
      totalCashReceived,
      totalCashCredits,
      totalBarter,
      totalBarterSettled: totalBarter,
      totalTaxDeducted,
      totalCredits,
      creditNotes,
      closingBalance: running,
      closingCashBalance: cashRunning,
      closingBarterBalance: barterRunning,
      hasBarterActivity,
      totalGrossInvoiced,
      totalSstInvoiced,
      totalGrossReceived,
      totalWhtWithheld,
      totalSstWithheld,
      pdcSummary
    };
  }, [selectedClient, clientProjects, selectedProjectId, selectedTxType, dateFrom, dateTo, invoices, vouchers, projects]);

  // Project Summary Breakdown (includes Project Opening Balance!)
  const projectSummary = useMemo(() => {
    if (!selectedClient) return [];
    return clientProjects.map(p => {
      const projOp = Number(p.openingBalance) || 0;
      const projInvoices = invoices.filter(i => i.projectId === p.id);
      const projVouchers = vouchers.filter(v => v.projectId === p.id && (v.type === "RV" || v.type === "CV" || (v.type === "BV" && v.barterDirection !== "vendor")) && !(v.isPdc && v.pdcStatus !== "Cleared"));
      const invoiced = projOp + projInvoices.reduce((s, i) => s + (Number(i.totalAmount || i.amount) || 0), 0);
      const received = projVouchers.reduce((s, v) => s + (Number(v.amount) || 0), 0);
      return {
        id: p.id,
        name: p.name,
        type: p.type,
        value: Number(p.budget || p.contractValue) || projOp || 0,
        openingBalance: projOp,
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

  const pkr = (val) => "PKR " + (Number(val) || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const displayBarterCols = showBarterCols !== null ? showBarterCols : Boolean(statementData.hasBarterActivity);

  const handleExportExcel = () => {
    if (!selectedClient) return;
    exportClientStatementToExcel({ client: selectedClient, dateFrom, dateTo, statementData: { ...statementData, hasBarterActivity: displayBarterCols } });
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
            <select className="form-select" value={activeClientId} onChange={e => { setActiveClientId(e.target.value); setSelectedProjectId("all"); if (onSelectClient) onSelectClient(e.target.value); }}>
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

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14, borderTop: "1px solid var(--rule)", paddingTop: 10, flexWrap: "wrap" }}>
          <button
            className="btn"
            onClick={() => setShowBarterCols(!displayBarterCols)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              background: displayBarterCols ? "rgba(15, 118, 110, 0.14)" : "var(--bg)",
              borderColor: "#0F766E",
              color: "#0F766E",
              fontWeight: 700
            }}
          >
            {displayBarterCols ? "✓ 🤝 Barter Columns: ON" : "🤝 Show Barter Columns"}
          </button>
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

            {/* STATEMENT SUMMARY CARDS (SEPARATE CASH OUTSTANDING + BARTER OUTSTANDING!) */}
            <div style={{ display: "grid", gridTemplateColumns: displayBarterCols ? "repeat(auto-fit, minmax(150px, 1fr))" : "repeat(6, 1fr)", gap: 10, marginTop: 20 }}>
              <div style={{ background: "var(--bg)", padding: 12, borderRadius: 8, border: "1px solid var(--rule)" }}>
                <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>Opening Balance</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", marginTop: 4 }}>{pkr(statementData.openingBalance)}</div>
                {displayBarterCols && (statementData.barterOpening || 0) > 0 && (
                  <div style={{ fontSize: 10, color: "#0F766E", fontWeight: 700, marginTop: 2 }}>
                    Cash: {pkr(statementData.cashOpening)} | Barter: {pkr(statementData.barterOpening)}
                  </div>
                )}
              </div>

              <div style={{ background: "var(--bg)", padding: 12, borderRadius: 8, border: "1px solid var(--rule)" }}>
                <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>Total Invoiced (+)</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0284C7", marginTop: 4 }}>{pkr(statementData.totalInvoiced)}</div>
                {displayBarterCols && (
                  <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, marginTop: 2 }}>
                    Cash: {pkr(statementData.totalCashInvoiced)} | Barter: {pkr(statementData.totalBarterInvoiced)}
                  </div>
                )}
              </div>

              <div style={{ background: "var(--bg)", padding: 12, borderRadius: 8, border: "1px solid var(--rule)" }}>
                <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>Cash / Bank Received (-)</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#059669", marginTop: 4 }}>{pkr(statementData.totalCashReceived !== undefined ? statementData.totalCashReceived : statementData.totalReceived)}</div>
              </div>

              {displayBarterCols && (
                <div style={{ background: "rgba(15, 118, 110, 0.08)", padding: 12, borderRadius: 8, border: "1px solid #5EEAD4" }}>
                  <div style={{ fontSize: 11, color: "#0F766E", fontWeight: 700 }}>🤝 Barter Settled (-)</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0F766E", marginTop: 4 }}>{pkr(statementData.totalBarterSettled || 0)}</div>
                </div>
              )}

              <div style={{ background: "var(--bg)", padding: 12, borderRadius: 8, border: "1px solid var(--rule)" }}>
                <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>Tax Deducted (WHT/SST)</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#D97706", marginTop: 4 }}>{pkr(statementData.totalTaxDeducted || 0)}</div>
              </div>

              <div style={{ background: "rgba(2, 132, 199, 0.08)", padding: 12, borderRadius: 8, border: "1.5px solid #0284C7" }}>
                <div style={{ fontSize: 11, color: "#0369A1", fontWeight: 700 }}>{displayBarterCols ? "💵 Cash Outstanding" : "Closing Outstanding"}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#0284C7", marginTop: 4 }}>{pkr(displayBarterCols ? statementData.closingCashBalance : statementData.closingBalance)}</div>
              </div>

              {displayBarterCols && (
                <div style={{ background: "rgba(15, 118, 110, 0.12)", padding: 12, borderRadius: 8, border: "1.5px solid #0F766E" }}>
                  <div style={{ fontSize: 11, color: "#0F766E", fontWeight: 700 }}>🤝 Barter Outstanding</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#0F766E", marginTop: 4 }}>{pkr(statementData.closingBarterBalance || 0)}</div>
                  <div style={{ fontSize: 10, color: "#0F172A", fontWeight: 700, marginTop: 2 }}>Combined: {pkr(statementData.closingBalance)}</div>
                </div>
              )}

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

          {/* DEDICATED PDC CHEQUE STATUS MINI-LEDGER (ONLY SHOWS UN-CLEARED / PENDING PDCs; ONCE CLEARED, THEY APPEAR IN MAIN LEDGER BELOW) */}
          {(() => {
            const unclearedPdcRows = (statementData.pdcSummary?.rows || []).filter(p => p.status !== "Cleared");
            if (unclearedPdcRows.length === 0) return null;
            return (
          <div className="card" style={{ padding: 0, marginBottom: 20, borderRadius: 10, overflow: "hidden", border: "1.5px solid #C4B5FD" }}>
            <div style={{ padding: "12px 16px", background: "linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(124, 58, 237, 0.02) 100%)", borderBottom: "1px solid #DDD6FE", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, color: "#5B21B6", display: "flex", alignItems: "center", gap: 6 }}>
                  📜 Pending PDC Cheques (Un-Cleared) — {selectedClient.name}
                </h4>
                <div style={{ fontSize: 11.5, color: "#6B7280", marginTop: 2 }}>
                  These un-cleared PDC cheques are <strong>NOT</strong> deducted from Client Ledger yet — once Cleared/Paid, they automatically move into the Client Ledger below
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ padding: "4px 10px", borderRadius: 16, fontSize: 11.5, fontWeight: 700, background: "rgba(124, 58, 237, 0.12)", color: "#6D28D9", border: "1px solid rgba(124, 58, 237, 0.3)" }}>
                  ⏳ Pending ({statementData.pdcSummary?.pendingCount || 0}): {pkr(statementData.pdcSummary?.pendingTotal || 0)}
                </span>
                {(statementData.pdcSummary?.bouncedCount || 0) > 0 && (
                  <span style={{ padding: "4px 10px", borderRadius: 16, fontSize: 11.5, fontWeight: 700, background: "rgba(220, 38, 38, 0.12)", color: "#B91C1C", border: "1px solid rgba(220, 38, 38, 0.3)" }}>
                    ✕ Bounced ({statementData.pdcSummary.bouncedCount}): {pkr(statementData.pdcSummary.bouncedTotal)}
                  </span>
                )}
              </div>
            </div>

            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Voucher #</th>
                  <th>Received Date</th>
                  <th>Maturity / Due Date</th>
                  <th>Cheque #</th>
                  <th>Drawn Bank</th>
                  <th>Project</th>
                  <th style={{ textAlign: "right" }}>Amount (PKR)</th>
                  <th style={{ textAlign: "center" }}>PDC Status</th>
                </tr>
              </thead>
              <tbody>
                {unclearedPdcRows.map(pdc => (
                  <tr key={pdc.id}>
                    <td><span style={{ fontFamily: "monospace", fontWeight: 700, color: "#6D28D9" }}>{pdc.voucherNo}</span></td>
                    <td>{pdc.issueDate}</td>
                    <td style={{ fontWeight: 700 }}>{pdc.maturityDate}</td>
                    <td><span style={{ fontFamily: "monospace", fontWeight: 700 }}>#{pdc.chequeNo}</span></td>
                    <td>{pdc.drawnBank}</td>
                    <td>{pdc.projectName}</td>
                    <td style={{ textAlign: "right", fontWeight: 800, color: pdc.status === "Bounced" ? "#DC2626" : "#6D28D9" }}>
                      {pkr(pdc.amount)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {pdc.status === "Bounced" ? (
                        <span style={{ padding: "2px 9px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: "rgba(220, 38, 38, 0.12)", color: "#B91C1C" }}>
                          ✕ Bounced
                        </span>
                      ) : (
                        <span style={{ padding: "2px 9px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: "rgba(124, 58, 237, 0.12)", color: "#6D28D9" }}>
                          ⏳ In-Hand (Not Deducted)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            );
          })()}

          {/* STATEMENT TABLE (SEPARATE CASH COLUMNS + BARTER COLUMNS) */}
          <div className="card" style={{ padding: 0, marginBottom: 20, borderRadius: 10, overflow: "hidden", border: "1px solid var(--rule)" }}>
            <div style={{ padding: "12px 16px", background: "var(--table-header-bg)", borderBottom: "1px solid var(--rule)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <h4 style={{ margin: 0, fontSize: 14 }}>
                Client Ledger Activity &amp; Running Balance {displayBarterCols ? "— Dual Cash & Barter Columns" : ""}
              </h4>
              <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{statementData.rows.length} Transactions</span>
            </div>

            <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                {displayBarterCols ? (
                  <>
                    <tr>
                      <th rowSpan={2} style={{ verticalAlign: "middle" }}>Date</th>
                      <th rowSpan={2} style={{ verticalAlign: "middle" }}>Reference</th>
                      <th rowSpan={2} style={{ verticalAlign: "middle" }}>Type</th>
                      <th rowSpan={2} style={{ verticalAlign: "middle" }}>Project / Particulars</th>
                      <th colSpan={3} style={{ textAlign: "center", background: "rgba(2, 132, 199, 0.1)", color: "#0369A1", borderLeft: "2px solid #CBD5E1" }}>
                        💵 CASH / BANK LEDGER (PKR)
                      </th>
                      <th colSpan={3} style={{ textAlign: "center", background: "rgba(15, 118, 110, 0.12)", color: "#0F766E", borderLeft: "2px solid #99F6E4" }}>
                        🤝 BARTER LEDGER (PKR)
                      </th>
                    </tr>
                    <tr>
                      <th style={{ textAlign: "right", background: "rgba(2, 132, 199, 0.05)", borderLeft: "2px solid #CBD5E1" }}>Cash Debit</th>
                      <th style={{ textAlign: "right", background: "rgba(2, 132, 199, 0.05)" }}>Cash Credit</th>
                      <th style={{ textAlign: "right", background: "rgba(2, 132, 199, 0.05)" }}>Cash Balance</th>
                      <th style={{ textAlign: "right", background: "rgba(15, 118, 110, 0.06)", borderLeft: "2px solid #99F6E4", color: "#0F766E" }}>Barter Debit</th>
                      <th style={{ textAlign: "right", background: "rgba(15, 118, 110, 0.06)", color: "#0F766E" }}>Barter Credit</th>
                      <th style={{ textAlign: "right", background: "rgba(15, 118, 110, 0.06)", color: "#0F766E" }}>Barter Balance</th>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>Project</th>
                    <th style={{ textAlign: "right" }}>Cash Debit (PKR)</th>
                    <th style={{ textAlign: "right" }}>Cash Credit (PKR)</th>
                    <th style={{ textAlign: "right" }}>Cash Balance (PKR)</th>
                  </tr>
                )}
              </thead>
              <tbody>
                <tr style={{ background: "var(--bg)", fontWeight: 600 }}>
                  <td>{dateFrom}</td>
                  <td><span style={{ fontFamily: "monospace", fontWeight: 700 }}>{statementData.openingRef || "OB-000"}</span></td>
                  <td>Opening Balance</td>
                  <td>{statementData.openingLabel || "—"}</td>
                  <td style={{ textAlign: "right", borderLeft: displayBarterCols ? "2px solid #E2E8F0" : undefined }}>—</td>
                  <td style={{ textAlign: "right" }}>—</td>
                  <td style={{ textAlign: "right", fontWeight: 800, color: "#0284C7" }}>{pkr(statementData.cashOpening !== undefined ? statementData.cashOpening : statementData.openingBalance)}</td>
                  {displayBarterCols && (
                    <>
                      <td style={{ textAlign: "right", borderLeft: "2px solid #CCFBF1", background: "rgba(15, 118, 110, 0.03)" }}>—</td>
                      <td style={{ textAlign: "right", background: "rgba(15, 118, 110, 0.03)" }}>—</td>
                      <td style={{ textAlign: "right", fontWeight: 800, color: "#0F766E", background: "rgba(15, 118, 110, 0.03)" }}>{pkr(statementData.barterOpening || 0)}</td>
                    </>
                  )}
                </tr>

                {statementData.rows.length === 0 ? (
                  <tr>
                    <td colSpan={displayBarterCols ? 10 : 7} style={{ textAlign: "center", padding: 30, color: "var(--ink-muted)" }}>
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
                          background: row.type === "Invoice" ? "rgba(2, 132, 199, 0.1)" : row.type === "Barter Settlement" ? "rgba(15, 118, 110, 0.14)" : row.type === "PDC Pending" ? "rgba(124, 58, 237, 0.12)" : row.type === "Cheque Bounced" ? "rgba(220, 38, 38, 0.12)" : row.type.startsWith("Tax Deduction") ? "rgba(217, 119, 6, 0.12)" : "rgba(5, 150, 105, 0.1)",
                          color: row.type === "Invoice" ? "#0284C7" : row.type === "Barter Settlement" ? "#0F766E" : row.type === "PDC Pending" ? "#7C3AED" : row.type === "Cheque Bounced" ? "#DC2626" : row.type.startsWith("Tax Deduction") ? "#B45309" : "#059669"
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
                                {row.taxBreakdown.barterAmount > 0 && (
                                  <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(15, 118, 110, 0.14)", color: "#0F766E", fontWeight: 700 }}>
                                    🤝 Barter ({row.taxBreakdown.barterPercent}%): {pkr(row.taxBreakdown.barterAmount)} | 💵 Cash: {pkr(row.taxBreakdown.cashAmount)}
                                  </span>
                                )}
                              </>
                            )}
                            {(row.taxBreakdown.kind === "receipt" || row.taxBreakdown.kind === "receipt_net") && (
                              <>
                                <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(100, 116, 139, 0.12)", color: "#475569", fontWeight: 600 }}>
                                  Gross Settled: {pkr(row.taxBreakdown.gross)}
                                </span>
                                {row.taxBreakdown.wht > 0 && (
                                  <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(217, 119, 6, 0.12)", color: "#B45309", fontWeight: 700 }}>
                                    - WHT ({row.taxBreakdown.whtRate}%): {pkr(row.taxBreakdown.wht)} (Shown on separate line)
                                  </span>
                                )}
                                {row.taxBreakdown.sst > 0 && (
                                  <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(139, 92, 246, 0.12)", color: "#7C3AED", fontWeight: 700 }}>
                                    - SST ({row.taxBreakdown.sstRate}%): {pkr(row.taxBreakdown.sst)} (Shown on separate line)
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
                            {row.taxBreakdown.kind === "tax_deduction" && (
                              <>
                                <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(217, 119, 6, 0.14)", color: "#B45309", fontWeight: 700 }}>
                                  {row.taxBreakdown.taxType} Withheld ({row.taxBreakdown.rate}%): {pkr(row.taxBreakdown.amount)}
                                </span>
                                <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "var(--bg)", border: "1px solid var(--rule)", color: "var(--ink-muted)" }}>
                                  Against Voucher {row.taxBreakdown.parentRef}
                                </span>
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
                      <td style={{ textAlign: "right", color: row.cashDebit > 0 ? "#0284C7" : "inherit", fontWeight: row.cashDebit > 0 ? 700 : 400, borderLeft: displayBarterCols ? "2px solid #E2E8F0" : undefined }}>
                        {row.cashDebit > 0 ? pkr(row.cashDebit) : "—"}
                      </td>
                      <td style={{ textAlign: "right", color: row.cashCredit > 0 ? (row.type.startsWith("Tax Deduction") ? "#B45309" : "#059669") : "inherit", fontWeight: row.cashCredit > 0 ? 700 : 400 }}>
                        {row.cashCredit > 0 ? pkr(row.cashCredit) : "—"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 800, color: row.cashRunningBalance > 0 ? "#0284C7" : "#059669" }}>
                        {pkr(row.cashRunningBalance)}
                      </td>
                      {displayBarterCols && (
                        <>
                          <td style={{ textAlign: "right", color: row.barterDebit > 0 ? "#0F766E" : "inherit", fontWeight: row.barterDebit > 0 ? 700 : 400, borderLeft: "2px solid #CCFBF1", background: "rgba(15, 118, 110, 0.03)" }}>
                            {row.barterDebit > 0 ? pkr(row.barterDebit) : "—"}
                          </td>
                          <td style={{ textAlign: "right", color: row.barterCredit > 0 ? "#059669" : "inherit", fontWeight: row.barterCredit > 0 ? 700 : 400, background: "rgba(15, 118, 110, 0.03)" }}>
                            {row.barterCredit > 0 ? pkr(row.barterCredit) : "—"}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 800, color: row.barterRunningBalance > 0 ? "#0F766E" : "#059669", background: "rgba(15, 118, 110, 0.03)" }}>
                            {pkr(row.barterRunningBalance)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: "var(--table-header-bg)", fontWeight: 800 }}>
                  <td colSpan="4">
                    Closing Outstanding Balance {displayBarterCols ? `(Combined: ${pkr(statementData.closingBalance)})` : ""}
                  </td>
                  <td style={{ textAlign: "right", color: "#0284C7", borderLeft: displayBarterCols ? "2px solid #CBD5E1" : undefined }}>{pkr(statementData.totalCashInvoiced !== undefined ? statementData.totalCashInvoiced : statementData.totalInvoiced)}</td>
                  <td style={{ textAlign: "right", color: "#059669" }}>{pkr(statementData.totalCashCredits !== undefined ? statementData.totalCashCredits : statementData.totalReceived)}</td>
                  <td style={{ textAlign: "right", fontSize: 15, color: "#0284C7" }}>{pkr(statementData.closingCashBalance !== undefined ? statementData.closingCashBalance : statementData.closingBalance)}</td>
                  {displayBarterCols && (
                    <>
                      <td style={{ textAlign: "right", color: "#0F766E", borderLeft: "2px solid #99F6E4", background: "rgba(15, 118, 110, 0.08)" }}>{pkr(statementData.totalBarterInvoiced || 0)}</td>
                      <td style={{ textAlign: "right", color: "#059669", background: "rgba(15, 118, 110, 0.08)" }}>{pkr(statementData.totalBarterSettled || 0)}</td>
                      <td style={{ textAlign: "right", fontSize: 15, color: "#0F766E", background: "rgba(15, 118, 110, 0.08)" }}>{pkr(statementData.closingBarterBalance || 0)}</td>
                    </>
                  )}
                </tr>
              </tfoot>
            </table>
            </div>
          </div>

          {/* PROJECTED NET RECEIVABLE AFTER PENDING PDC CLEARANCE */}
          {(statementData.pdcSummary?.pendingCount || 0) > 0 && (() => {
            const pendingAmt = statementData.pdcSummary.pendingTotal || 0;
            const projectedNet = statementData.closingBalance - pendingAmt;
            const projectedCash = (statementData.closingCashBalance !== undefined ? statementData.closingCashBalance : statementData.closingBalance) - pendingAmt;
            return (
              <div
                className="card"
                style={{
                  marginTop: 14,
                  marginBottom: 16,
                  padding: "14px 18px",
                  borderRadius: 10,
                  border: "1.5px solid #0284C7",
                  background: "linear-gradient(135deg, rgba(2, 132, 199, 0.06) 0%, rgba(5, 150, 105, 0.05) 100%)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0369A1", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                    📜 PDC Reconciliation — Projected Receivable After Pending Cheque Clearance
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 12, background: "#FEF3C7", color: "#92400E", border: "1px solid #F59E0B" }}>
                    ⏳ {statementData.pdcSummary.pendingCount} Pending PDC{statementData.pdcSummary.pendingCount > 1 ? "s" : ""} In-Hand (Not Deducted Yet)
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, alignItems: "center" }}>
                  <div style={{ background: "var(--card-bg, #FFFFFF)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--rule)" }}>
                    <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>Current Closing Ledger Receivable</div>
                    <div className="mono" style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", marginTop: 3 }}>
                      {pkr(statementData.closingBalance)}
                    </div>
                  </div>
                  <div style={{ background: "rgba(245, 158, 11, 0.08)", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(217, 119, 6, 0.35)" }}>
                    <div style={{ fontSize: 11, color: "#B45309", fontWeight: 700 }}>
                      Less: Pending Client PDCs ({statementData.pdcSummary.pendingCount} Chq{statementData.pdcSummary.pendingCount > 1 ? "s" : ""})
                    </div>
                    <div className="mono" style={{ fontSize: 16, fontWeight: 800, color: "#D97706", marginTop: 3 }}>
                      − {pkr(pendingAmt)}
                    </div>
                  </div>
                  <div style={{
                    background: projectedNet <= 0 ? "rgba(5, 150, 105, 0.1)" : "rgba(2, 132, 199, 0.1)",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1.5px solid ${projectedNet <= 0 ? "#059669" : "#0284C7"}`
                  }}>
                    <div style={{ fontSize: 11, color: projectedNet <= 0 ? "#065F46" : "#0369A1", fontWeight: 800, textTransform: "uppercase" }}>
                      Net Balance After PDC Deduction
                    </div>
                    <div className="mono" style={{ fontSize: 18, fontWeight: 900, color: projectedNet <= 0 ? "#059669" : "#0284C7", marginTop: 3 }}>
                      {pkr(projectedNet)}
                    </div>
                    {displayBarterCols && (
                      <div style={{ fontSize: 10.5, color: "var(--ink-muted)", marginTop: 3 }}>
                        Cash After PDC: <strong style={{ color: "#0284C7" }}>{pkr(projectedCash)}</strong> · Barter: <strong style={{ color: "#0F766E" }}>{pkr(statementData.closingBarterBalance || 0)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

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
          statementData={{ ...statementData, hasBarterActivity: displayBarterCols }}
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
