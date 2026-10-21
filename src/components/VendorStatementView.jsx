import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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

function fmtDocDate(val) {
  if (!val) return "—";
  try {
    const s = String(val).trim();
    if (!s) return "—";
    const parts = s.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parts[0];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const mIdx = parseInt(parts[1], 10) - 1;
      const day = parts[2].padStart(2, "0");
      if (mIdx >= 0 && mIdx < 12) {
        return `${day} ${monthNames[mIdx]} ${year}`;
      }
    }
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${String(dt.getDate()).padStart(2, "0")} ${monthNames[dt.getMonth()]} ${dt.getFullYear()}`;
    }
    return s;
  } catch (e) {
    return val;
  }
}

export function VendorStatementPrintModal({ vendor, dateFrom, dateTo, statementData, onClose }) {
  const [pageSize, setPageSize] = useState("A4");
  const [pageOrientation, setPageOrientation] = useState("portrait");
  const [pageMargin, setPageMargin] = useState("8mm");
  const [printScale, setPrintScale] = useState("100%");
  const [docTitle, setDocTitle] = useState("VENDOR STATEMENT OF ACCOUNT");
  const printRef = useRef(null);

  const pkr = (val) => "Rs " + Math.round(Number(val) || 0).toLocaleString("en-PK");

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
    exportVendorStatementToExcel({ vendor, dateFrom, dateTo, statementData });
  };

  const printAreaHeightMm = pageContentHeightMm(pageSize, pageOrientation, pageMargin);
  const printScaleFactor = parseInt(printScale) / 100;
  const printAreaScaledHeightMm = printAreaHeightMm / printScaleFactor;

  const thStyle = {
    border: "1px solid #000000",
    padding: "7px 4px",
    textAlign: "center",
    verticalAlign: "middle",
    fontSize: 10.5,
    fontWeight: 800,
    boxSizing: "border-box",
    lineHeight: 1.25,
    background: "#F1F5F9",
    color: "#0F172A",
    wordBreak: "break-word"
  };

  const tdCenter = {
    border: "1px solid #000000",
    padding: "6px 4px",
    textAlign: "center",
    verticalAlign: "middle",
    boxSizing: "border-box",
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1.3,
    color: "#0F172A"
  };

  const tdLeft = {
    border: "1px solid #000000",
    padding: "6px 6px",
    textAlign: "left",
    verticalAlign: "middle",
    fontWeight: 600,
    wordBreak: "break-word",
    boxSizing: "border-box",
    fontSize: 11,
    lineHeight: 1.3,
    color: "#0F172A"
  };

  const tdRight = {
    border: "1px solid #000000",
    padding: "6px 5px",
    textAlign: "right",
    verticalAlign: "middle",
    fontWeight: 700,
    boxSizing: "border-box",
    fontSize: 11,
    lineHeight: 1.3,
    color: "#0F172A",
    whiteSpace: "nowrap"
  };

  const labelStyle = {
    border: "1px solid #000000",
    padding: "7px 12px",
    fontWeight: 800,
    textAlign: "right",
    verticalAlign: "middle",
    boxSizing: "border-box",
    fontSize: 11.5,
    whiteSpace: "nowrap",
    color: "#0F172A"
  };

  const valStyle = {
    border: "1px solid #000000",
    padding: "7px 6px",
    textAlign: "right",
    verticalAlign: "middle",
    fontWeight: 800,
    boxSizing: "border-box",
    fontSize: 11.5,
    whiteSpace: "nowrap",
    color: "#0F172A"
  };

  const modalContent = (
    <div className="modal-backdrop statement-print-portal" onClick={onClose}>
      <style>{`
        @page {
          size: ${PAGE_SIZES[pageSize] || pageSize} ${pageOrientation};
          margin: ${pageMargin};
        }
        .statement-print-portal .print-area table {
          width: 100% !important;
          max-width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
          min-width: 0 !important;
          margin-bottom: 12px !important;
          border: 1px solid #000000 !important;
        }
        .statement-print-portal .print-area th {
          font-size: 10.5px !important;
          padding: 7px 4px !important;
          text-align: center !important;
          vertical-align: middle !important;
          font-weight: 800 !important;
          box-sizing: border-box !important;
          line-height: 1.25 !important;
          background: #F1F5F9 !important;
          color: #0F172A !important;
          border: 1px solid #000000 !important;
          text-transform: uppercase !important;
          word-break: break-word !important;
        }
        .statement-print-portal .print-area td {
          font-size: 11px !important;
          padding: 6px 5px !important;
          vertical-align: middle !important;
          box-sizing: border-box !important;
          border: 1px solid #000000 !important;
          color: #0F172A !important;
          font-weight: 600 !important;
          line-height: 1.3 !important;
          word-break: break-word !important;
        }
        @media print {
          *, *::before, *::after {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
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
          #root, .no-print-header, .no-print {
            display: none !important;
          }
          .statement-print-portal {
            background: #ffffff !important;
            padding: 0 !important;
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            overflow: visible !important;
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
            background: transparent !important;
          }
          .statement-print-portal .print-area {
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            transform: scale(${printScaleFactor});
            transform-origin: top left;
            width: ${100 / printScaleFactor}% !important;
            max-width: ${100 / printScaleFactor}% !important;
            min-height: ${printAreaScaledHeightMm - 3}mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          .statement-print-portal .print-area table,
          .statement-print-portal .print-area th,
          .statement-print-portal .print-area td {
            border-color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .statement-print-portal .print-area thead {
            display: table-header-group !important;
          }
          .statement-print-portal .print-area tr {
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
            margin-top: auto !important;
            position: relative !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
      <div className="modal" style={{ width: 1040, maxWidth: "98vw", maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        {/* MODAL TOP TOOLBAR (MATCHING INVOICE PRINT PREVIEW) */}
        <div className="no-print-header" style={{ marginBottom: 14, background: "#1E293B", padding: "14px 18px", borderRadius: 12, color: "#fff", border: "1px solid #334155", boxShadow: "0 4px 14px rgba(0,0,0,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 800, fontSize: 13.5, color: "#F59E0B", display: "flex", alignItems: "center", gap: 5 }}>
                <FileText size={16} /> Statement Format:
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#0F172A", padding: "4px 10px", borderRadius: 8, border: "1px solid #D97706" }}>
                <span style={{ fontSize: 11, color: "#FBBF24", fontWeight: 700 }}>Title:</span>
                <select value={docTitle} onChange={e => setDocTitle(e.target.value)} style={{ background: "transparent", border: "none", color: "#FDE68A", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  <option value="VENDOR STATEMENT OF ACCOUNT" style={{ background: "#1E293B", color: "#FFFFFF" }}>VENDOR STATEMENT OF ACCOUNT</option>
                  <option value="ACCOUNTS PAYABLE LEDGER STATEMENT" style={{ background: "#1E293B", color: "#FFFFFF" }}>ACCOUNTS PAYABLE LEDGER STATEMENT</option>
                  <option value="VENDOR BILLING & PAYMENT SUMMARY" style={{ background: "#1E293B", color: "#FFFFFF" }}>VENDOR BILLING &amp; PAYMENT SUMMARY</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#0F172A", padding: "4px 8px", borderRadius: 8, border: "1px solid #334155" }}>
                <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>Paper:</span>
                <select value={pageSize} onChange={e => setPageSize(e.target.value)} style={{ background: "transparent", border: "none", color: "#FFF", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  <option value="A4" style={{ background: "#1E293B", color: "#FFFFFF" }}>A4 (210 x 297 mm)</option>
                  <option value="Letter" style={{ background: "#1E293B", color: "#FFFFFF" }}>Letter (8.5 x 11 in)</option>
                  <option value="Legal" style={{ background: "#1E293B", color: "#FFFFFF" }}>Legal (8.5 x 14 in)</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#0F172A", padding: "4px 8px", borderRadius: 8, border: "1px solid #334155" }}>
                <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>Orient:</span>
                <select value={pageOrientation} onChange={e => setPageOrientation(e.target.value)} style={{ background: "transparent", border: "none", color: "#FFF", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  <option value="portrait" style={{ background: "#1E293B", color: "#FFFFFF" }}>Portrait 📄</option>
                  <option value="landscape" style={{ background: "#1E293B", color: "#FFFFFF" }}>Landscape 📑</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#0F172A", padding: "4px 8px", borderRadius: 8, border: "1px solid #334155" }}>
                <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>Margin:</span>
                <select value={pageMargin} onChange={e => setPageMargin(e.target.value)} style={{ background: "transparent", border: "none", color: "#FFF", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  <option value="8mm" style={{ background: "#1E293B", color: "#FFFFFF" }}>Compact (8mm)</option>
                  <option value="12mm" style={{ background: "#1E293B", color: "#FFFFFF" }}>Normal (12mm)</option>
                  <option value="15mm" style={{ background: "#1E293B", color: "#FFFFFF" }}>Wide (15mm)</option>
                  <option value="0mm" style={{ background: "#1E293B", color: "#FFFFFF" }}>Zero (0mm)</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#0F172A", padding: "4px 8px", borderRadius: 8, border: "1px solid #334155" }}>
                <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>Scale:</span>
                <select value={printScale} onChange={e => setPrintScale(e.target.value)} style={{ background: "transparent", border: "none", color: "#FFF", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  <option value="100%" style={{ background: "#1E293B", color: "#FFFFFF" }}>100%</option>
                  <option value="95%" style={{ background: "#1E293B", color: "#FFFFFF" }}>95%</option>
                  <option value="90%" style={{ background: "#1E293B", color: "#FFFFFF" }}>90%</option>
                  <option value="85%" style={{ background: "#1E293B", color: "#FFFFFF" }}>85%</option>
                </select>
              </div>

              <button className="btn" style={{ background: "var(--rose)", color: "#fff", border: "none", padding: "6px 10px" }} onClick={onClose}><X size={15} /></button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 12.5, color: "#94A3B8" }}>
              Formatted for <b>Official Sindh Revenue Board (SRB) Tax &amp; Audit Compliance</b>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 12.5, fontWeight: 700 }} onClick={handleExportPDF}>
                <Download size={14} /> Download PDF
              </button>
              <button className="btn" style={{ background: "#059669", color: "#FFFFFF", border: "none", padding: "6px 14px", fontSize: 12.5, fontWeight: 700 }} onClick={handleExportExcel}>
                <Download size={14} /> Download Excel
              </button>
              <button className="btn" style={{ background: "#475569", color: "#FFFFFF", border: "none", padding: "6px 14px", fontSize: 12.5, fontWeight: 700 }} onClick={() => window.print()}>
                <Printer size={14} /> Printout
              </button>
            </div>
          </div>
        </div>

        {/* PRINT AREA MATCHING OFFICIAL INVOICE TEMPLATE */}
        <div ref={printRef} className="print-area" style={{ background: "#ffffff", color: "#000000", padding: "18px 24px 14px 24px", fontFamily: "'Calibri', 'Inter', sans-serif", border: "none", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", borderRadius: 8, position: "relative", boxSizing: "border-box", width: "100%", minHeight: "920px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          
          {/* TOP CONTENT */}
          <div>
            {/* HEADER SECTION - 3 COLUMN BALANCED GRID (EXACT INVOICE FORMAT) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 16 }}>
              {/* Left Logo */}
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <img src="./logo.png" alt="AdPulse Logo" style={{ height: 76, maxHeight: 80, width: "auto", objectFit: "contain" }} onError={(e) => { e.target.style.display = 'none'; }} />
              </div>

              {/* Center Heading (Mathematically Centered) */}
              <div style={{ textAlign: "center", padding: "0 10px" }}>
                <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, textDecoration: "underline", letterSpacing: "1px", textTransform: "uppercase", color: "#0F172A" }}>
                  {docTitle}
                </h2>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", marginTop: 2 }}>
                  Sindh Revenue Board (SRB) Regn. # SA054896-8 &middot; NTN: A0654656-8
                </div>
              </div>

              {/* Right Meta Info */}
              <div style={{ textAlign: "right", fontSize: 13, fontWeight: 700, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div style={{ marginBottom: 3 }}>DATE: <span style={{ fontWeight: 600 }}>{fmtDocDate(new Date().toISOString().slice(0, 10))}</span></div>
                <div style={{ marginBottom: 3 }}>STATEMENT NO: <span style={{ fontWeight: 800 }}>STMT-{(vendor.vendorCode || vendor.id || "").toUpperCase()}</span></div>
                <div style={{ fontSize: 11.5 }}>PERIOD: <span style={{ fontWeight: 700 }}>{fmtDocDate(dateFrom)} – {fmtDocDate(dateTo)}</span></div>
              </div>
            </div>

            {/* VENDOR / PARTY INFO STRIP (EXACT INVOICE BLACK-BORDERED BOX) */}
            <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 14, display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr", gap: 10, alignItems: "center", background: "#F8FAFC", padding: "10px 14px", border: "1px solid #000000", borderRadius: 6, boxSizing: "border-box" }}>
              <div style={{ wordBreak: "break-word", textAlign: "left" }}>
                <div>VENDOR / PARTY: <span style={{ fontWeight: 800, color: "#0F172A" }}>{(vendor.companyName || vendor.name || "VENDOR").toUpperCase()}</span> <span style={{ color: "#475569" }}>({vendor.vendorCode || vendor.id})</span></div>
                <div style={{ fontSize: 11, marginTop: 3, fontWeight: 600 }}>CONTACT: <span style={{ fontWeight: 700 }}>{vendor.contactPerson || "N/A"} {vendor.phone ? `(${vendor.phone})` : ""}</span></div>
              </div>
              <div style={{ wordBreak: "break-word", textAlign: "left" }}>
                <div>BANK &amp; ACCOUNT: <span style={{ fontWeight: 700, color: "#0F172A" }}>{vendor.bankName || "N/A"} {vendor.accountNumberIban ? `· ${vendor.accountNumberIban}` : ""}</span></div>
                <div style={{ fontSize: 11, marginTop: 3, fontWeight: 600 }}>PAYMENT TERMS: <span style={{ fontWeight: 700 }}>{vendor.paymentTerms || "Net 30"}</span></div>
              </div>
              <div style={{ wordBreak: "break-word", textAlign: "right" }}>
                <div>NTN / STRN: <span style={{ fontWeight: 700, color: "#0F172A" }}>{vendor.ntn || "N/A"}{vendor.strn ? ` / ${vendor.strn}` : ""}</span></div>
                <div style={{ fontSize: 11, marginTop: 3 }}>CLOSING PAYABLE: <span style={{ fontWeight: 800, color: "#A81C1C" }}>{pkr(statementData.closingPayable)}</span></div>
              </div>
            </div>

            {/* 4 SUMMARY KPI BOXES (BLACK BORDERED MATCHING INVOICE STYLE) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>
              <div style={{ background: "#F8FAFC", padding: "8px 10px", borderRadius: 4, border: "1px solid #000000", textAlign: "center" }}>
                <div style={{ fontSize: 9.5, color: "#475569", fontWeight: 800, textTransform: "uppercase" }}>OPENING PAYABLE</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginTop: 3 }}>{pkr(statementData.openingPayable)}</div>
              </div>
              <div style={{ background: "#F8FAFC", padding: "8px 10px", borderRadius: 4, border: "1px solid #000000", textAlign: "center" }}>
                <div style={{ fontSize: 9.5, color: "#D97706", fontWeight: 800, textTransform: "uppercase" }}>TOTAL BILLS / EXP (+)</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#D97706", marginTop: 3 }}>{pkr(statementData.totalExpenses)}</div>
              </div>
              <div style={{ background: "#F8FAFC", padding: "8px 10px", borderRadius: 4, border: "1px solid #000000", textAlign: "center" }}>
                <div style={{ fontSize: 9.5, color: "#059669", fontWeight: 800, textTransform: "uppercase" }}>TOTAL PAYMENTS (-)</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#059669", marginTop: 3 }}>{pkr(statementData.totalPayments)}</div>
              </div>
              <div style={{ background: "#F1F5F9", padding: "8px 10px", borderRadius: 4, border: "1.5px solid #000000", textAlign: "center" }}>
                <div style={{ fontSize: 9.5, color: "#A81C1C", fontWeight: 800, textTransform: "uppercase" }}>CLOSING PAYABLE</div>
                <div style={{ fontSize: 13.5, fontWeight: 900, color: "#A81C1C", marginTop: 3 }}>{pkr(statementData.closingPayable)}</div>
              </div>
            </div>

            {/* TRANSACTIONS TABLE (EXACT INVOICE TABLE BORDERS & TOTALS HIERARCHY) */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12, border: "1px solid #000000", fontSize: 11, boxSizing: "border-box", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "5%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "24%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "11%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={thStyle}>S.NO</th>
                  <th style={thStyle}>DATE</th>
                  <th style={thStyle}>REF NO</th>
                  <th style={thStyle}>TYPE</th>
                  <th style={thStyle}>PROJECT / EXPENSE PARTICULARS</th>
                  <th style={thStyle}>DEBIT / PAID (PKR)</th>
                  <th style={thStyle}>CREDIT / BILL (PKR)</th>
                  <th style={thStyle}>BALANCE (PKR)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: "#F8FAFC" }}>
                  <td style={{ ...tdCenter, fontWeight: 700 }}>1</td>
                  <td style={tdCenter}>{fmtDocDate(dateFrom)}</td>
                  <td style={{ ...tdCenter, fontWeight: 700, fontFamily: "monospace" }}>OB-000</td>
                  <td style={tdCenter}>Opening Balance</td>
                  <td style={tdLeft}>Opening Balance Brought Forward</td>
                  <td style={tdCenter}>—</td>
                  <td style={tdCenter}>—</td>
                  <td style={tdRight}>{pkr(statementData.openingPayable)}</td>
                </tr>

                {statementData.rows.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ ...tdCenter, fontWeight: 700 }}>{idx + 2}</td>
                    <td style={tdCenter}>{fmtDocDate(row.date)}</td>
                    <td style={{ ...tdCenter, fontWeight: 700, fontFamily: "monospace", whiteSpace: "nowrap" }}>{row.ref}</td>
                    <td style={{ ...tdCenter, fontWeight: 700, color: row.type === "Vendor Bill" ? "#D97706" : "#059669" }}>
                      {row.type}
                    </td>
                    <td style={tdLeft}>
                      <div style={{ fontWeight: 700 }}>{row.project}</div>
                      {row.taxBreakdown && row.taxBreakdown.kind === "bill" && (
                        <div style={{ fontSize: 9.5, color: "#475569", marginTop: 2, lineHeight: 1.25 }}>
                          Gross Bill: {pkr(row.taxBreakdown.gross)} {row.taxBreakdown.category ? `[${row.taxBreakdown.category}]` : ""}
                        </div>
                      )}
                      {row.taxBreakdown && row.taxBreakdown.kind === "payment" && (
                        <div style={{ fontSize: 9.5, color: "#047857", marginTop: 2, lineHeight: 1.25 }}>
                          Gross: {pkr(row.taxBreakdown.gross)} {row.taxBreakdown.comm > 0 ? `| Comm (${row.taxBreakdown.commRate}%): -${pkr(row.taxBreakdown.comm)}` : ""} {row.taxBreakdown.sst > 0 ? `| Input SST (${row.taxBreakdown.sstRate}%): +${pkr(row.taxBreakdown.sst)}` : ""} {row.taxBreakdown.wht > 0 ? `| WHT (${row.taxBreakdown.whtRate}%): -${pkr(row.taxBreakdown.wht)}` : ""} | Net Paid: {pkr(row.taxBreakdown.net)} {row.taxBreakdown.mode ? `[${row.taxBreakdown.mode}${row.taxBreakdown.instrumentNo ? ` #${row.taxBreakdown.instrumentNo}` : ""}]` : ""}
                        </div>
                      )}
                      {row.taxBreakdown && row.taxBreakdown.kind === "direct_settlement" && (
                        <div style={{ fontSize: 9.5, color: "#B45309", marginTop: 2, lineHeight: 1.25 }}>
                          Direct Settled: {pkr(row.taxBreakdown.amount)} {row.taxBreakdown.mode ? `[${row.taxBreakdown.mode}${row.taxBreakdown.instrumentNo ? ` #${row.taxBreakdown.instrumentNo}` : ""}]` : ""}
                        </div>
                      )}
                    </td>
                    <td style={{ ...tdRight, color: row.debit > 0 ? "#059669" : "#0F172A" }}>
                      {row.debit > 0 ? pkr(row.debit) : "—"}
                    </td>
                    <td style={{ ...tdRight, color: row.credit > 0 ? "#D97706" : "#0F172A" }}>
                      {row.credit > 0 ? pkr(row.credit) : "—"}
                    </td>
                    <td style={{ ...tdRight, color: row.runningBalance > 0 ? "#A81C1C" : "#059669" }}>
                      {pkr(row.runningBalance)}
                    </td>
                  </tr>
                ))}

                {/* INVOICE-STYLE TOTALS ROWS */}
                <tr>
                  <td colSpan={5} style={labelStyle}>PERIOD TOTALS (PAYMENTS vs BILLS)</td>
                  <td style={{ ...valStyle, color: "#059669" }}>{pkr(statementData.totalPayments)}</td>
                  <td style={{ ...valStyle, color: "#D97706" }}>{pkr(statementData.totalExpenses)}</td>
                  <td style={valStyle}>{pkr(statementData.closingPayable)}</td>
                </tr>
                <tr style={{ background: "#F1F5F9", fontWeight: 800 }}>
                  <td colSpan={7} style={{ border: "1px solid #000000", padding: "8px 12px", fontSize: 12.5, textAlign: "right", verticalAlign: "middle", boxSizing: "border-box", fontWeight: 800, whiteSpace: "nowrap" }}>
                    NET CLOSING PAYABLE BALANCE
                  </td>
                  <td style={{ border: "1px solid #000000", padding: "8px 6px", textAlign: "right", verticalAlign: "middle", fontSize: 12.5, color: "#A81C1C", boxSizing: "border-box", fontWeight: 800, whiteSpace: "nowrap" }}>
                    {pkr(statementData.closingPayable)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* AMOUNT IN WORDS (EXACT INVOICE BOX) */}
            <div style={{ fontSize: 11.5, fontStyle: "italic", marginBottom: 10, background: "#F8FAFC", padding: "8px 12px", border: "1px solid #000000", borderRadius: 4 }}>
              Amount in words: <b style={{ fontStyle: "normal", color: "#000000" }}>{amountInWords(statementData.closingPayable)}</b>
            </div>

            {/* SPECIAL NOTES & TERMS SECTION (EXACT INVOICE BOX) */}
            <div style={{ fontSize: 10.5, lineHeight: 1.45, color: "#1E293B", background: "#F8FAFC", padding: "9px 14px", border: "1px solid #000000", borderRadius: 6 }}>
              <div style={{ fontWeight: 800, textDecoration: "underline", marginBottom: 4, color: "#0F172A", textTransform: "uppercase", fontSize: 11 }}>
                Special Notes &amp; Terms:
              </div>
              <div>• PLEASE VERIFY THIS STATEMENT OF ACCOUNT AND NOTIFY ANY DISCREPANCY WITHIN 7 WORKING DAYS.</div>
              <div>• ALL VENDOR DISBURSEMENTS &amp; TAX DEDUCTIONS (SST / WHT) ARE SUBJECT TO OFFICIAL AUDIT RECONCILIATION.</div>
              <div>• ADPULSE IMC (PRIVATE) LTD — NTN: <b>A0654656-8</b> / SRB STRN: <b>SA054896-8</b></div>
            </div>
          </div>

          {/* BOTTOM PINNED FOOTER: SIGNATURES & RED BANNER (EXACT INVOICE FOOTER) */}
          <div className="print-signatures" style={{ marginTop: "auto", paddingTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14, fontSize: 11.5, fontWeight: 700 }}>
              <div style={{ textAlign: "center", width: 220 }}>
                <div style={{ borderTop: "1.5px solid #000000", paddingTop: 5, letterSpacing: "0.3px" }}>ACCOUNTANT SIGNATURE</div>
              </div>
              <div style={{ textAlign: "center", width: 220 }}>
                <div style={{ borderTop: "1.5px solid #000000", paddingTop: 5, letterSpacing: "0.3px" }}>ACCOUNTS MANAGER</div>
              </div>
              <div style={{ textAlign: "center", width: 220 }}>
                <div style={{ borderTop: "1.5px solid #000000", paddingTop: 5, letterSpacing: "0.3px" }}>AUTHORIZED SIGNATORY</div>
              </div>
            </div>

            <div className="invoice-footer-banner" style={{ background: "#A81C1C", backgroundImage: "linear-gradient(90deg, #A81C1C 0%, #1D3B4E 100%)", color: "#FFFFFF", padding: "8px 14px", borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10.5, fontWeight: 600, boxSizing: "border-box", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              <div>📞 +92 21 37526834</div>
              <div>✉️ communication@adpulse.pk | 🌐 www.adpulse.pk</div>
              <div>📍 Office # 213, 2nd Floor, Park Tower, Block 5 Clifton, Karachi.</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
}

export default function VendorStatementView({
  vendors = [],
  projects = [],
  expenses = [],
  vouchers = [],
  journal = [],
  selectedVendorId,
  onSelectVendor,
  isModal = false,
  onClose
}) {
  const [activeVendorId, setActiveVendorId] = useState(selectedVendorId || (vendors[0]?.id || ""));
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-12-31");
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(true);

  useEffect(() => {
    if (selectedVendorId) {
      setActiveVendorId(selectedVendorId);
    }
  }, [selectedVendorId]);

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

  const selectedVendor = useMemo(() => {
    if (!vendors || vendors.length === 0) return null;
    return vendors.find(v => v.id === activeVendorId || v.vendorCode === activeVendorId) || vendors[0] || null;
  }, [vendors, activeVendorId]);

  // Compute transactions & opening balance from posted entries
  const statementData = useMemo(() => {
    if (!selectedVendor) {
      return { openingPayable: 0, rows: [], totalExpenses: 0, totalPayments: 0, closingPayable: 0, totalGrossBilled: 0, totalGrossPaid: 0, totalCommission: 0, totalInputSst: 0, totalWhtDeducted: 0, totalNetPaid: 0 };
    }

    const vendorNameNorm = (selectedVendor.name || "").toLowerCase();

    const isVendorMatch = (item) => {
      if (!item || !selectedVendor) return false;
      if (item.vendorId === selectedVendor.id) return true;
      if (item.vendor && item.vendor.toLowerCase().includes(vendorNameNorm)) return true;
      if (item.category && item.category.toLowerCase().includes(vendorNameNorm)) return true;
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

    // Prior Payments / Direct Settlements (Debits)
    vouchers.filter(v => isVendorMatch(v) && isProjectMatch(v) && v.date < dateFrom && (v.type === "PV" || v.type === "CV")).forEach(v => {
      opening -= Number(v.amount) || 0;
    });

    // 2. Filter Statement Rows within date range
    const rawRows = [];

    expenses.filter(e => isVendorMatch(e) && isProjectMatch(e) && e.date >= dateFrom && e.date <= dateTo).forEach(exp => {
      const proj = projects.find(p => p.id === exp.projectId);
      const gross = Number(exp.amount) || 0;
      rawRows.push({
        id: exp.id,
        date: exp.date,
        ref: exp.expenseNo || ("EXP-" + exp.id.toUpperCase()),
        type: "Vendor Bill",
        project: proj ? proj.name : (exp.category || "Operating Expense"),
        debit: 0,
        credit: gross,
        status: exp.status === "paid" ? "Paid" : "Unpaid AP",
        taxBreakdown: {
          kind: "bill",
          gross,
          category: exp.category,
          subcategory: exp.subcategory
        },
        raw: exp
      });
    });

    vouchers.filter(v => isVendorMatch(v) && isProjectMatch(v) && v.date >= dateFrom && v.date <= dateTo && (v.type === "PV" || v.type === "CV")).forEach(v => {
      const proj = projects.find(p => p.id === v.projectId);
      const isDirect = v.type === "CV";
      const typeLabel = isDirect ? "Direct Settlement" : "Vendor Payment";
      const defaultDesc = isDirect
        ? `Direct Settlement by Client (${v.party || "Client"})${v.instrumentNo ? ` [${v.paymentMode || 'Inst'} #${v.instrumentNo}]` : ""}`
        : (v.description || `Vendor Payment${v.paymentMode ? ` [${v.paymentMode}${v.instrumentNo ? ` #${v.instrumentNo}` : ''}]` : ''}`);

      const gross = Number(v.grossAmount) || Number(v.amount) || 0;
      const comm = Number(v.commAmount) || 0;
      const commRate = Number(v.commRate) || 0;
      const sst = Number(v.sstAmount) || 0;
      const sstRate = Number(v.sstRate) || 0;
      const wht = Number(v.whtAmount) || 0;
      const whtRate = Number(v.whtRate) || 0;
      const net = Number(v.netAmount) || Number(v.amount) || 0;

      let taxBreakdown = null;
      if (isDirect) {
        taxBreakdown = {
          kind: "direct_settlement",
          amount: Number(v.amount) || 0,
          mode: v.paymentMode || "Direct Settlement",
          instrumentNo: v.instrumentNo || v.chequeNo,
          client: v.party || v.client || "Client"
        };
      } else {
        taxBreakdown = {
          kind: "payment",
          gross,
          comm,
          commRate,
          sst,
          sstRate,
          wht,
          whtRate,
          net,
          mode: v.paymentMode || (v.chequeNo ? "Cross Cheque" : "Bank Transfer"),
          instrumentNo: v.instrumentNo || v.chequeNo,
          bank: v.bankAccount || v.bank
        };
      }

      rawRows.push({
        id: v.id,
        date: v.date,
        ref: v.voucherNo || ((isDirect ? "CV-" : "PV-") + v.id.toUpperCase()),
        type: typeLabel,
        project: proj ? proj.name : defaultDesc,
        debit: Number(v.amount) || 0,
        credit: 0,
        status: v.status || "Posted",
        taxBreakdown,
        raw: v
      });
    });

    rawRows.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Accounts Payable Sign Convention: Balance = Opening + Credits - Debits
    let running = opening;
    let totalExpenses = 0;
    let totalPayments = 0;

    let totalGrossBilled = 0;
    let totalGrossPaid = 0;
    let totalCommission = 0;
    let totalInputSst = 0;
    let totalWhtDeducted = 0;

    const rowsWithBalance = rawRows.map(r => {
      running = running + r.credit - r.debit;
      totalExpenses += r.credit;
      totalPayments += r.debit;

      if (r.type === "Vendor Bill") {
        totalGrossBilled += r.credit;
      }
      if (r.taxBreakdown && r.taxBreakdown.kind === "payment") {
        totalGrossPaid += (r.taxBreakdown.gross || r.debit);
        totalCommission += (r.taxBreakdown.comm || 0);
        totalInputSst += (r.taxBreakdown.sst || 0);
        totalWhtDeducted += (r.taxBreakdown.wht || 0);
      }
      return { ...r, runningBalance: running };
    });

    return {
      openingPayable: opening,
      rows: rowsWithBalance,
      totalExpenses,
      totalPayments,
      closingPayable: running,
      totalGrossBilled,
      totalGrossPaid,
      totalCommission,
      totalInputSst,
      totalWhtDeducted
    };
  }, [selectedVendor, selectedProjectId, dateFrom, dateTo, expenses, vouchers, projects]);

  const pkr = (val) => "PKR " + (Number(val) || 0).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const handleExportExcel = () => {
    if (!selectedVendor) return;
    exportVendorStatementToExcel({ vendor: selectedVendor, dateFrom, dateTo, statementData });
  };

  const mainContent = (
    <div style={{ padding: isModal ? 0 : 20 }}>
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
          <button
            className="btn"
            onClick={() => setShowTaxBreakdown(!showTaxBreakdown)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              background: showTaxBreakdown ? "rgba(217, 119, 6, 0.12)" : "var(--bg)",
              borderColor: "#D97706",
              color: "#D97706",
              fontWeight: 600
            }}
          >
            {showTaxBreakdown ? "✓ Tax & Gross Breakdown: ON" : "Show Tax & Gross Breakdown"}
          </button>
          <button className="btn" onClick={handleExportExcel} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "#059669", borderColor: "#059669", color: "#FFFFFF" }}>
            <Download size={15} /> Export Excel
          </button>
          <button className="btn btn-primary" onClick={() => setShowPrintModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "#D97706", borderColor: "#D97706", color: "#FFFFFF" }}>
            <Printer size={15} /> Print Preview &amp; Printout
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

            {/* TAX BREAKDOWN SUMMARY RIBBON */}
            {showTaxBreakdown && (
              <div style={{
                marginTop: 14,
                padding: "10px 16px",
                borderRadius: 8,
                background: "rgba(217, 119, 6, 0.06)",
                border: "1px dashed #D97706",
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 12,
                fontSize: 12
              }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>Pre-Tax Gross Incurred</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1E293B", marginTop: 2 }}>{pkr(statementData.totalGrossBilled)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>Input SST (Sales Tax)</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0284C7", marginTop: 2 }}>{pkr(statementData.totalInputSst)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>Vendor WHT Deducted (FBR)</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#DC2626", marginTop: 2 }}>{pkr(statementData.totalWhtDeducted)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>Agency Comm. Retained</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#D97706", marginTop: 2 }}>{pkr(statementData.totalCommission)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>Net Cash Paid to Vendor</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#059669", marginTop: 2 }}>{pkr(statementData.totalNetPaid)}</div>
                </div>
              </div>
            )}
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
                      <td>
                        <div style={{ fontWeight: 600 }}>{row.project}</div>
                        {showTaxBreakdown && row.taxBreakdown && (
                          <div style={{ marginTop: 5, display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {row.taxBreakdown.kind === "bill" && (
                              <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(217, 119, 6, 0.12)", color: "#B45309", fontWeight: 700 }}>
                                Gross Bill: {pkr(row.taxBreakdown.gross)} {row.taxBreakdown.category ? `[${row.taxBreakdown.category}]` : ""}
                              </span>
                            )}
                            {row.taxBreakdown.kind === "payment" && (
                              <>
                                <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(100, 116, 139, 0.12)", color: "#475569", fontWeight: 600 }}>
                                  Gross: {pkr(row.taxBreakdown.gross)}
                                </span>
                                {row.taxBreakdown.comm > 0 && (
                                  <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(217, 119, 6, 0.12)", color: "#B45309", fontWeight: 700 }}>
                                    - Comm ({row.taxBreakdown.commRate}%): {pkr(row.taxBreakdown.comm)}
                                  </span>
                                )}
                                {row.taxBreakdown.sst > 0 && (
                                  <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(2, 132, 199, 0.12)", color: "#0284C7", fontWeight: 700 }}>
                                    + Input SST ({row.taxBreakdown.sstRate}%): {pkr(row.taxBreakdown.sst)}
                                  </span>
                                )}
                                {row.taxBreakdown.wht > 0 && (
                                  <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(220, 38, 38, 0.12)", color: "#DC2626", fontWeight: 700 }}>
                                    - WHT ({row.taxBreakdown.whtRate}%): {pkr(row.taxBreakdown.wht)}
                                  </span>
                                )}
                                <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(5, 150, 105, 0.12)", color: "#059669", fontWeight: 800 }}>
                                  Net Paid: {pkr(row.taxBreakdown.net)}
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
                                  Client: {row.taxBreakdown.client} {row.taxBreakdown.instrumentNo ? `[#${row.taxBreakdown.instrumentNo}]` : ""}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </td>
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

  if (isModal) {
    return (
      <div className="modal-backdrop" style={{ zIndex: 1150, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", padding: "16px" }} onClick={onClose}>
        <div className="modal" style={{ width: 1320, maxWidth: "96vw", maxHeight: "94vh", display: "flex", flexDirection: "column", padding: 0, borderRadius: 16, background: "var(--card-bg, #FFFFFF)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)", border: "1px solid #E2E8F0", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
          {/* MODAL HEADER */}
          <div style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #D97706, #B45309)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(217, 119, 6, 0.35)" }}>
                <Building2 size={22} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                    {selectedVendor?.companyName || selectedVendor?.name || "Vendor Statement"}
                  </h3>
                  <span style={{ background: "#D97706", color: "#FFFFFF", padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                    {selectedVendor?.vendorCode || selectedVendor?.id}
                  </span>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94A3B8" }}>
                  Vendor Statement &amp; Accounts Payable Sub-Ledger &middot; Period: <strong>{dateFrom}</strong> to <strong>{dateTo}</strong>
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button className="btn" onClick={() => setShowPrintModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, background: "linear-gradient(135deg, #D97706, #B45309)", borderColor: "#D97706", color: "#FFFFFF", cursor: "pointer" }}>
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
