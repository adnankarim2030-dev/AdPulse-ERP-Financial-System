import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Printer, Download, FileText, X } from "lucide-react";

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
  const prefix = Number(num) < 0 ? "Negative " : "";
  return prefix + str.trim() + " Rupees Only";
}

function pageContentHeightMm(size, orientation, marginStr) {
  const dims = {
    A4: [210, 297],
    Letter: [215.9, 279.4],
    Legal: [215.9, 355.6],
  };
  const [w, h] = dims[size] || dims.A4;
  const pageH = orientation === "landscape" ? w : h;
  const m = parseFloat(marginStr) || 0;
  return Math.max(100, pageH - m * 2);
}

export function exportCashBankStatementToExcel({
  accountLabel,
  accountObj,
  dateFrom,
  dateTo,
  openingBalance,
  totalDeposits,
  totalPayments,
  closingBalance,
  rows = []
}) {
  const pkr = (val) => "PKR " + (Number(val) || 0).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const safeName = (accountLabel || "Cash_Bank_Ledger").replace(/[^a-zA-Z0-9]/g, "_");
  const periodText = (dateFrom || dateTo) ? `${dateFrom || "Start"} to ${dateTo || "Present"}` : "All Dates (Complete Ledger)";

  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="UTF-8"></head>
    <body>
      <table border="1" style="border-collapse:collapse; font-family:Calibri, sans-serif; font-size:11pt;">
        <tr>
          <th colspan="8" style="background:#0F172A; color:#FFFFFF; font-size:14pt; padding:8px; text-align:center;">
            AdPulse IMC (Private) Ltd — CASH &amp; BANK ACCOUNT STATEMENT
          </th>
        </tr>
        <tr>
          <td colspan="4"><b>Account / Vault:</b> ${accountLabel}</td>
          <td colspan="4"><b>Statement Period:</b> ${periodText}</td>
        </tr>
        ${accountObj ? `
        <tr>
          <td colspan="4"><b>Account Title:</b> ${accountObj.accountTitle || "AdPulse IMC Pvt Ltd"} | <b>A/C No:</b> ${accountObj.accountNumber || "N/A"}</td>
          <td colspan="4"><b>Branch:</b> ${accountObj.branch || "Karachi"} | <b>Type:</b> ${accountObj.accountType || "Bank Account"}</td>
        </tr>
        ` : ""}
        <tr>
          <td colspan="2"><b>Opening Balance (B/F):</b> ${pkr(openingBalance)}</td>
          <td colspan="2"><b>Total Deposits (In +):</b> ${pkr(totalDeposits)}</td>
          <td colspan="2"><b>Total Payments (Out -):</b> ${pkr(totalPayments)}</td>
          <td colspan="2"><b>Closing Balance:</b> <b>${pkr(closingBalance)}</b></td>
        </tr>
        <tr style="background:#F1F5F9; font-weight:bold; text-align:center;">
          <th>S.NO</th>
          <th>DATE</th>
          <th>VOUCHER / REF #</th>
          <th>ACCOUNT / VAULT</th>
          <th>PARTICULARS / DESCRIPTION</th>
          <th>DEPOSIT / IN (PKR)</th>
          <th>PAYMENT / OUT (PKR)</th>
          <th>RUNNING BALANCE (PKR)</th>
        </tr>
  `;

  rows.forEach((r, idx) => {
    html += `
      <tr>
        <td style="text-align:center;">${r.isBroughtForward ? "—" : idx + 1}</td>
        <td style="text-align:center;">${r.date || "—"}</td>
        <td style="text-align:center; font-family:monospace;">${r.reference || "—"}</td>
        <td>${r.bankName || "—"}</td>
        <td>${r.description || "—"}${r.memo && r.memo !== r.description ? ` (${r.memo})` : ""}</td>
        <td style="text-align:right;">${!r.isBroughtForward && r.debit > 0 ? r.debit : 0}</td>
        <td style="text-align:right;">${!r.isBroughtForward && r.credit > 0 ? r.credit : 0}</td>
        <td style="text-align:right; font-weight:bold;">${r.runningBalance || 0}</td>
      </tr>
    `;
  });

  html += `
        <tr style="background:#F8FAFC; font-weight:bold;">
          <td colspan="5" style="text-align:right;">PERIOD TOTALS</td>
          <td style="text-align:right;">${totalDeposits}</td>
          <td style="text-align:right;">${totalPayments}</td>
          <td style="text-align:right;">${closingBalance}</td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Cash_Bank_Statement_${safeName}_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function CashBankStatementPrintModal({
  accountLabel,
  accountObj,
  dateFrom,
  dateTo,
  openingBalance = 0,
  totalDeposits = 0,
  totalPayments = 0,
  closingBalance = 0,
  rows = [],
  onClose
}) {
  const [pageSize, setPageSize] = useState("A4");
  const [pageOrientation, setPageOrientation] = useState("portrait");
  const [pageMargin, setPageMargin] = useState("8mm");
  const [printScale, setPrintScale] = useState("100%");
  const printRef = useRef(null);

  const pkr = (val) => "PKR " + (Number(val) || 0).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
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

  const periodDisplay = (dateFrom || dateTo)
    ? `${dateFrom ? fmtDate(dateFrom) : "Beginning"} to ${dateTo ? fmtDate(dateTo) : "Present"}`
    : "All Dates (Complete Ledger)";

  const stmtCode = accountObj?.accountNumber
    ? `CB-${String(accountObj.accountNumber).slice(-6).toUpperCase()}`
    : `CB-${new Date().getFullYear().toString().slice(-2)}-ALL`;

  const handleExportPDF = () => {
    const printEl = printRef.current;
    if (!printEl) return;
    const safeName = (accountLabel || "Cash_Bank_Statement").replace(/[^a-zA-Z0-9]/g, "_");

    const triggerPdf = () => {
      if (window.html2pdf) {
        const opt = {
          margin: 6,
          filename: `Cash_Bank_Statement_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: (pageSize || "A4").toLowerCase(), orientation: pageOrientation || "portrait" }
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
    exportCashBankStatementToExcel({
      accountLabel,
      accountObj,
      dateFrom,
      dateTo,
      openingBalance,
      totalDeposits,
      totalPayments,
      closingBalance,
      rows
    });
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
              <FileText size={18} /> Cash &amp; Bank Statement Print Preview (Invoice Format)
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
                  <img src="./logo.png" alt="AdPulse Logo" style={{ height: 68, maxHeight: 72, width: "auto", objectFit: "contain" }} onError={(e) => { e.target.style.display = "none"; }} />
                </div>

                <div style={{ textAlign: "center", padding: "0 10px" }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.4px", color: "#000000", textDecoration: "underline" }}>
                    CASH &amp; BANK ACCOUNT STATEMENT
                  </h2>
                  <div style={{ fontSize: 8.5, color: "#000000", marginTop: 3, fontWeight: 700 }}>
                    AdPulse IMC (Private) Ltd | SRB # S9940258-8 | NTN # 9940258-8
                  </div>
                </div>

                <div style={{ textAlign: "right", fontSize: 9.5, lineHeight: 1.4, color: "#000000" }}>
                  <div><b>DATE:</b> {fmtDate(new Date().toISOString().slice(0, 10))}</div>
                  <div><b>STATEMENT NO:</b> {stmtCode}</div>
                  <div><b>PERIOD:</b> {periodDisplay}</div>
                </div>
              </div>

              {/* 2. ACCOUNT DETAILS STRIP (Matches Invoice Black Bordered Info Strip) */}
              <div style={{ border: "1px solid #000000", padding: "6px 10px", marginBottom: 10, display: "grid", gridTemplateColumns: "1.3fr 1.1fr 0.9fr", gap: 8, fontSize: 9.5, color: "#000000", lineHeight: 1.4 }}>
                <div>
                  <div><b>ACCOUNT / VAULT:</b> <span style={{ fontWeight: 700 }}>{accountObj ? accountObj.bankName : accountLabel}</span></div>
                  <div><b>ACCOUNT TITLE:</b> {accountObj ? (accountObj.accountTitle || "AdPulse IMC (Pvt) Ltd") : "AdPulse IMC (Private) Ltd"}</div>
                </div>
                <div>
                  <div><b>ACCOUNT NO:</b> {accountObj ? (accountObj.accountNumber || "N/A") : "Multiple / Consolidated"}</div>
                  <div><b>IBAN / BRANCH:</b> {accountObj ? `${accountObj.iban && accountObj.iban !== "N/A" ? accountObj.iban + " | " : ""}${accountObj.branch || "Karachi"}` : "Karachi Head Office & Branches"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div><b>ACCOUNT TYPE:</b> {accountObj ? (accountObj.accountType || "Current Account") : "Treasury Ledger"}</div>
                  <div><b>CLOSING BALANCE:</b> <span style={{ fontWeight: 800 }}>{pkr(closingBalance)}</span></div>
                </div>
              </div>

              {/* 3. SUMMARY METRIC BOXES (Crisp Black Borders) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10 }}>
                <div style={{ border: "1px solid #000000", padding: "5px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "#000000" }}>OPENING BALANCE (B/F)</div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#000000", marginTop: 2 }}>{pkr(openingBalance)}</div>
                </div>
                <div style={{ border: "1px solid #000000", padding: "5px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "#000000" }}>TOTAL DEPOSITS (IN +)</div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#000000", marginTop: 2 }}>{pkr(totalDeposits)}</div>
                </div>
                <div style={{ border: "1px solid #000000", padding: "5px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "#000000" }}>TOTAL PAYMENTS (OUT -)</div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#000000", marginTop: 2 }}>{pkr(totalPayments)}</div>
                </div>
                <div style={{ border: "1.5px solid #000000", padding: "5px 8px", textAlign: "center", background: "#F8FAFC" }}>
                  <div style={{ fontSize: 8, fontWeight: 800, textTransform: "uppercase", color: "#000000" }}>CLOSING BALANCE</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#000000", marginTop: 2 }}>{pkr(closingBalance)}</div>
                </div>
              </div>

              {/* 4. TRANSACTIONS TABLE (Matches Official Invoice Table Grid) */}
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10, fontSize: 9, border: "1px solid #000000", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "5%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "11%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ border: "1px solid #000000", padding: "5px 3px", textAlign: "center" }}>S.NO</th>
                    <th style={{ border: "1px solid #000000", padding: "5px 3px", textAlign: "center" }}>DATE</th>
                    <th style={{ border: "1px solid #000000", padding: "5px 3px", textAlign: "center" }}>REF / VCH #</th>
                    <th style={{ border: "1px solid #000000", padding: "5px 3px", textAlign: "center" }}>ACCOUNT / VAULT</th>
                    <th style={{ border: "1px solid #000000", padding: "5px 5px", textAlign: "left" }}>PARTICULARS / DESCRIPTION</th>
                    <th style={{ border: "1px solid #000000", padding: "4px 4px", textAlign: "right", lineHeight: 1.15 }}>DEPOSIT / IN<br />(PKR)</th>
                    <th style={{ border: "1px solid #000000", padding: "4px 4px", textAlign: "right", lineHeight: 1.15 }}>PAYMENT / OUT<br />(PKR)</th>
                    <th style={{ border: "1px solid #000000", padding: "4px 4px", textAlign: "right", lineHeight: 1.15 }}>BALANCE<br />(PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ border: "1px solid #000000", textAlign: "center", padding: 14, color: "#000000" }}>
                        No cash or bank transactions recorded within this date range.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, idx) => (
                      <tr key={row.key || idx} style={row.isBroughtForward ? { fontWeight: 700, background: "#F8FAFC" } : undefined}>
                        <td style={{ border: "1px solid #000000", padding: "4px 3px", textAlign: "center", fontWeight: 600 }}>
                          {row.isBroughtForward ? "—" : idx + 1}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 3px", textAlign: "center" }}>{fmtDate(row.date)}</td>
                        <td style={{ border: "1px solid #000000", padding: "4px 3px", textAlign: "center", fontWeight: 700, fontFamily: "monospace" }}>
                          {row.reference}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 4px", textAlign: "center", fontWeight: 600 }}>
                          {row.bankName}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 5px", wordBreak: "break-word" }}>
                          <div style={{ fontWeight: 700 }}>{row.description}</div>
                          {row.memo && row.memo !== row.description && (
                            <div style={{ fontSize: 7.5, color: "#000000", marginTop: 1, lineHeight: 1.2 }}>
                              {row.memo}
                            </div>
                          )}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 4px", textAlign: "right", fontWeight: !row.isBroughtForward && row.debit > 0 ? 700 : 400 }}>
                          {!row.isBroughtForward && row.debit > 0 ? pkr(row.debit) : "—"}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 4px", textAlign: "right", fontWeight: !row.isBroughtForward && row.credit > 0 ? 700 : 400 }}>
                          {!row.isBroughtForward && row.credit > 0 ? pkr(row.credit) : "—"}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 4px", textAlign: "right", fontWeight: 700 }}>
                          {pkr(row.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}

                  {/* SUMMARY ROWS (Matches Official Invoice Summary Table Rows) */}
                  <tr>
                    <td colSpan={5} style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "right", fontWeight: 700 }}>PERIOD TOTALS</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", fontWeight: 700 }}>{pkr(totalDeposits)}</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", fontWeight: 700 }}>{pkr(totalPayments)}</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", fontWeight: 700 }}>{pkr(closingBalance)}</td>
                  </tr>
                  <tr>
                    <td colSpan={7} style={{ border: "1px solid #000000", padding: "6px 6px", textAlign: "right", fontWeight: 700, fontSize: 10 }}>NET CLOSING ACCOUNT BALANCE</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", textAlign: "right", fontWeight: 800, fontSize: 10.5 }}>{pkr(closingBalance)}</td>
                  </tr>
                </tbody>
              </table>

              {/* 5. AMOUNT IN WORDS & SPECIAL NOTES (Matches Official Invoice Footer Sections) */}
              <div style={{ border: "1px solid #000000", padding: "6px 10px", marginBottom: 8, fontSize: 9.5, color: "#000000" }}>
                <b>Amount in words:</b> <i>{amountInWords(closingBalance)}</i>
              </div>

              <div style={{ border: "1px solid #000000", padding: "6px 10px", fontSize: 9, lineHeight: 1.4, color: "#000000" }}>
                <div style={{ fontWeight: 700, textDecoration: "underline", marginBottom: 2 }}>Special Notes &amp; Reconciliation Terms:</div>
                <div>1. This is an official system-generated Cash &amp; Bank Sub-Ledger Statement of <b>AdPulse IMC (Private) Ltd</b>.</div>
                <div>2. Uncleared Post-Dated Cheques (PDCs) are tracked separately in the PDC Register until bank encashment / clearance.</div>
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
