import React, { useState } from "react";
import { Printer, X, FileText, Download, Check } from "lucide-react";

function fmtNum(n) {
  if (n === null || n === undefined || isNaN(n)) return "0.00";
  return Number(n).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtInt(n) {
  if (n === null || n === undefined || isNaN(n)) return "0";
  return Math.round(Number(n)).toLocaleString("en-PK");
}

function fmtDateDIPR(d) {
  if (!d) return "—";
  try {
    const s = String(d).trim();
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
    return d;
  }
}

function threeDigitWords(n) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  let s = "";
  if (n >= 100) {
    s += ones[Math.floor(n / 100)] + " Hundred ";
    n %= 100;
  }
  if (n >= 20) {
    s += tens[Math.floor(n / 10)] + " ";
    n %= 10;
  }
  if (n > 0) {
    s += ones[n] + " ";
  }
  return s.trim();
}

function amountInWordsPk(num) {
  num = Math.round(num);
  if (num === 0) return "Zero Rupees Only";
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const hundred = num;
  const parts = [];
  if (crore) parts.push(threeDigitWords(crore) + " Crore");
  if (lakh) parts.push(threeDigitWords(lakh) + " Lakh");
  if (thousand) parts.push(threeDigitWords(thousand) + " Thousand");
  if (hundred) parts.push(threeDigitWords(hundred));
  return parts.join(" ") + " Rupees Only";
}

export default function GovtInvoicePrintModal({ invoice, onClose }) {
  const [activeView, setActiveView] = useState("agency-invoice"); // "agency-invoice" | "govt-sheet"

  if (!invoice) return null;

  const isSalesTax = invoice.isSalesTaxInvoice !== false;
  const docTitle = isSalesTax ? "SALES TAX INVOICE (15% SST)" : "SALES INVOICE";
  const items = invoice.items || [];
  const commRate = invoice.agencyCommissionRate || 15;
  const sstRate = isSalesTax ? (invoice.sstRate || 15) : 0;
  const whtRate = invoice.whtRate || 10;
  const mediaRate = invoice.mediaShareRate || 85;
  const newspaperWhtRate = invoice.newspaperWhtRate || 1.5;

  // Calculate row by row for agency invoice
  const agencyRows = items.map((item, idx) => {
    const rate = Number(item.ratePerCm) || 0;
    const size = Number(item.size) || 0;
    const gross = rate * size;
    const comm = gross * (commRate / 100);
    const sst = isSalesTax ? (comm * (sstRate / 100)) : 0;
    const commWithSst = comm + sst;
    const wht = commWithSst * (whtRate / 100);
    const netCheque = commWithSst - wht;

    return {
      ...item,
      sno: idx + 1,
      rate,
      size,
      gross,
      comm,
      sst,
      commWithSst,
      wht,
      netCheque
    };
  });

  // Calculate totals for agency invoice
  const agencyTotals = agencyRows.reduce((acc, r) => {
    acc.gross += r.gross;
    acc.comm += r.comm;
    acc.sst += r.sst;
    acc.commWithSst += r.commWithSst;
    acc.wht += r.wht;
    acc.netCheque += r.netCheque;
    return acc;
  }, { gross: 0, comm: 0, sst: 0, commWithSst: 0, wht: 0, netCheque: 0 });

  // Calculate row by row for Govt 85/15 Sanction Sheet
  const govtNewspaperRows = items.map((item, idx) => {
    const rate = Number(item.ratePerCm) || 0;
    const size = Number(item.size) || 0;
    const gross = rate * size;
    const mediaAmt85 = gross * (mediaRate / 100);
    const comm15 = gross * (commRate / 100);
    const sst = 0;
    const commWithSst = comm15;
    const less15MediaWht = mediaAmt85 * (newspaperWhtRate / 100);
    const netCheque = mediaAmt85 - less15MediaWht;

    return {
      ...item,
      sno: idx + 1,
      rate,
      size,
      gross,
      mediaAmt85,
      comm15,
      sst,
      commWithSst,
      lessWht: less15MediaWht,
      netCheque
    };
  });

  // AdPulse agency summary row for Govt Sanction Sheet
  const totalGrossForGovt = govtNewspaperRows.reduce((s, r) => s + r.gross, 0);
  const totalAgencyComm15 = totalGrossForGovt * (commRate / 100);
  const totalAgencySst = isSalesTax ? (totalAgencyComm15 * (sstRate / 100)) : 0;
  const totalAgencyCommWithSst = totalAgencyComm15 + totalAgencySst;
  const totalAgencyWht = totalAgencyCommWithSst * (whtRate / 100);
  const totalAgencyNetCheque = totalAgencyCommWithSst - totalAgencyWht;

  const agencySummaryRow = {
    sno: govtNewspaperRows.length + 1,
    newspaper: "ADPULSE IMC (PVT.) LTD",
    rate: null,
    size: null,
    gross: null,
    mediaAmt85: null,
    comm15: totalAgencyComm15,
    sst: totalAgencySst,
    commWithSst: totalAgencyCommWithSst,
    lessWht: totalAgencyWht,
    netCheque: totalAgencyNetCheque
  };

  const govtTotals = {
    gross: totalGrossForGovt,
    sst: totalAgencySst,
    netCheque: govtNewspaperRows.reduce((s, r) => s + r.netCheque, 0) + totalAgencyNetCheque
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const printEl = document.querySelector(".print-area");
    if (!printEl) return;
    const refNo = invoice.invoiceNo || "Govt_Invoice";

    if (window.html2pdf) {
      const opt = {
        margin: 8,
        filename: `${refNo}_${activeView}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      window.html2pdf().set(opt).from(printEl).save();
    } else {
      window.print();
    }
  };

  const handleExportExcel = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += `ADPULSE IMC (PVT) LTD - GOVERNMENT INVOICE EXPORT\n`;
    csvContent += `Document Type:,${docTitle}\n`;
    csvContent += `Invoice No:,${invoice.invoiceNo}\n`;
    csvContent += `Date:,${invoice.date}\n`;
    csvContent += `Department / Client:,${invoice.clientName || invoice.client}\n`;
    csvContent += `RO Number:,${invoice.roNumber}\n`;
    csvContent += `Caption:,${invoice.caption}\n\n`;

    csvContent += `S.No,Newspaper,Rate/CM,Size,Position,Pub Date,Gross (PKR),15% Comm,15% SST,Net Cheque\n`;
    agencyRows.forEach(r => {
      csvContent += `${r.sno},"${r.newspaper}",${r.rate},${r.size},"${r.position}",${r.publishDate},${r.gross},${r.comm},${r.sst},${r.netCheque}\n`;
    });

    csvContent += `\n`;
    csvContent += `Total 100% Gross Media (PKR):,${agencyTotals.gross.toFixed(2)}\n`;
    csvContent += `15% Agency Commission (PKR):,${agencyTotals.comm.toFixed(2)}\n`;
    if (isSalesTax) csvContent += `15% SRB Sales Tax (PKR):,${agencyTotals.sst.toFixed(2)}\n`;
    csvContent += `Less: 10% WHT (PKR):,-${agencyTotals.wht.toFixed(2)}\n`;
    csvContent += `Net Cheque Payable (PKR):,${agencyTotals.netCheque.toFixed(2)}\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Govt_Invoice_${invoice.invoiceNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const thStyle = {
    border: "1px solid #000000",
    padding: "6px 2px",
    textAlign: "center",
    verticalAlign: "middle",
    fontSize: 10,
    fontWeight: 800,
    boxSizing: "border-box",
    lineHeight: 1.2,
    background: "#F1F5F9",
    color: "#0F172A",
    wordBreak: "break-word",
    whiteSpace: "normal"
  };

  const tdCenter = {
    border: "1px solid #000000",
    padding: "6px 2px",
    textAlign: "center",
    verticalAlign: "middle",
    boxSizing: "border-box",
    fontSize: 10.5,
    lineHeight: 1.25,
    color: "#0F172A",
    whiteSpace: "normal",
    wordBreak: "break-word"
  };

  const tdRight = {
    border: "1px solid #000000",
    padding: "6px 4px",
    textAlign: "right",
    verticalAlign: "middle",
    boxSizing: "border-box",
    fontSize: 10.5,
    lineHeight: 1.25,
    color: "#0F172A",
    whiteSpace: "nowrap"
  };

  const tdLeft = {
    border: "1px solid #000000",
    padding: "6px 5px",
    textAlign: "left",
    verticalAlign: "middle",
    boxSizing: "border-box",
    fontSize: 10.5,
    fontWeight: 700,
    lineHeight: 1.25,
    color: "#0F172A",
    wordBreak: "break-word"
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 8mm;
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
          }
          .no-print-header, .sidebar, .topbar, .btn, .mobile-toggle, .content, .main, .erp-root > .main, .erp-root > .sidebar, .erp-root > .topbar {
            display: none !important;
          }
          .modal-backdrop {
            background: none !important;
            padding: 0 !important;
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
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
            background: transparent !important;
          }
          .print-area {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 278mm !important;
            max-height: 282mm !important;
            height: 280mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            overflow: visible !important;
          }
          .invoice-footer-banner {
            background: #A81C1C !important;
            background-image: linear-gradient(90deg, #A81C1C 0%, #1D3B4E 100%) !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            display: flex !important;
            visibility: visible !important;
            margin-top: auto !important;
          }
          table, th, td {
            border-color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div
        className="modal"
        style={{ width: 1040, maxWidth: "98vw", maxHeight: "92vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Control Bar (Non-Printable) */}
        <div className="no-print-header" style={{ marginBottom: 14, background: "#1E293B", padding: "14px 18px", borderRadius: 12, color: "#fff", border: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 800, fontSize: 13.5, color: "#F59E0B", display: "flex", alignItems: "center", gap: 6 }}>
              <FileText size={16} /> Document Layout:
            </span>
            {/* View Switcher Tabs */}
            <div style={{ display: "inline-flex", background: "#0F172A", padding: 3, borderRadius: 8, border: "1px solid #475569" }}>
              <button
                type="button"
                onClick={() => setActiveView("agency-invoice")}
                style={{
                  padding: "5px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: activeView === "agency-invoice" ? "linear-gradient(135deg, #B8860B 0%, #D4AF37 100%)" : "transparent",
                  color: activeView === "agency-invoice" ? "#FFFFFF" : "#94A3B8",
                  transition: "all 0.2s"
                }}
              >
                📄 1. AdPulse Sales Tax Invoice
              </button>
              <button
                type="button"
                onClick={() => setActiveView("govt-sheet")}
                style={{
                  padding: "5px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: activeView === "govt-sheet" ? "linear-gradient(135deg, #B8860B 0%, #D4AF37 100%)" : "transparent",
                  color: activeView === "govt-sheet" ? "#FFFFFF" : "#94A3B8",
                  transition: "all 0.2s"
                }}
              >
                📑 2. Govt 85/15 Media Sanction Sheet
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 12.5, fontWeight: 700 }} onClick={handleExportPDF}>
              <Download size={14} /> Download PDF
            </button>
            <button className="btn" style={{ background: "#059669", color: "#FFFFFF", border: "none", padding: "6px 14px", fontSize: 12.5, fontWeight: 700 }} onClick={handleExportExcel}>
              <Download size={14} /> Download Excel
            </button>
            <button className="btn" style={{ background: "#475569", color: "#FFFFFF", border: "none", padding: "6px 14px", fontSize: 12.5, fontWeight: 700 }} onClick={handlePrint}>
              <Printer size={14} /> Print
            </button>
            <button className="btn" style={{ background: "var(--rose)", color: "#FFFFFF", border: "none", padding: "6px 10px" }} onClick={onClose}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: ADPULSE AGENCY INVOICE / SALES TAX INVOICE */}
        {/* ========================================================================= */}
        {activeView === "agency-invoice" && (
          <div
            className="print-area"
            style={{
              background: "#ffffff",
              color: "#000000",
              padding: "18px 24px 14px 24px",
              fontFamily: "'Calibri', 'Inter', sans-serif",
              border: "none",
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
              borderRadius: 8,
              position: "relative",
              boxSizing: "border-box",
              width: "100%",
              minHeight: "1050px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            {/* TOP CONTENT: HEADER, CLIENT INFO, TABLE, TOTALS, NOTES */}
            <div>
              {/* 1. ERP STANDARD 3-COLUMN BALANCED HEADER */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 16 }}>
                {/* Left: Official AdPulse Logo */}
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <img
                    src="./logo.png"
                    alt="AdPulse Logo"
                    style={{ height: 76, maxHeight: 80, width: "auto", objectFit: "contain" }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>

                {/* Center: Official Underlined Heading */}
                <div style={{ textAlign: "center", padding: "0 10px" }}>
                  <h2 style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 800,
                    textDecoration: "underline",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color: isSalesTax ? "#A81C1C" : "#0F172A"
                  }}>
                    {docTitle}
                  </h2>
                  {isSalesTax && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", marginTop: 2 }}>
                      Sindh Revenue Board (SRB) Regn. # SA054896-8
                    </div>
                  )}
                </div>

                {/* Right: Date & Invoice Number */}
                <div style={{ textAlign: "right", fontSize: 13.5, fontWeight: 700, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <div style={{ marginBottom: 4 }}>
                    DATE: <span style={{ fontWeight: 600 }}>{fmtDateDIPR(invoice.date)}</span>
                  </div>
                  <div>
                    INVOICE NO: <span style={{ fontWeight: 800 }}>{invoice.invoiceNo}</span>
                  </div>
                </div>
              </div>

              {/* 2. CLIENT / DEPARTMENT & PROJECT SCOPE INFO CARD */}
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 16,
                display: "grid",
                gridTemplateColumns: "1.2fr 1.2fr 1fr",
                gap: 10,
                alignItems: "center",
                background: "#F8FAFC",
                padding: "10px 14px",
                border: "1px solid #000000",
                borderRadius: 6,
                boxSizing: "border-box"
              }}>
                <div style={{ wordBreak: "break-word", textAlign: "left" }}>
                  CLIENT: <span style={{ fontWeight: 700, color: "#0F172A" }}>{(invoice.clientName || invoice.client || "INFORMATION DEPARTMENT / GOVT OF SINDH").toUpperCase()}</span>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 2, fontWeight: 600 }}>
                    NTN: {invoice.ntn || "9031600-2"} &middot; STN: {invoice.stn || "S-9031600-2"}
                  </div>
                </div>
                <div style={{ wordBreak: "break-word", textAlign: "left" }}>
                  RO &amp; CAPTION: <span style={{ fontWeight: 700, color: "#0F172A" }}>{invoice.roNumber || "INF/KRY/3215/26"}</span>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 2, fontWeight: 600 }}>
                    {invoice.caption || "NOTICE INVITING BIDS"} {invoice.roDate ? `(${fmtDateDIPR(invoice.roDate)})` : ""}
                  </div>
                </div>
                <div style={{ wordBreak: "break-word", textAlign: "right" }}>
                  SERVICE / TYPE: <span style={{ fontWeight: 700, color: "#A81C1C" }}>GOVT PRINT MEDIA</span>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 2, fontWeight: 600 }}>
                    15% AGENCY COMM. {isSalesTax ? "+ 15% SST" : ""}
                  </div>
                </div>
              </div>

              {/* 3. NEWSPAPER LINE ITEMS TABLE */}
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: 14,
                border: "1px solid #000000",
                fontSize: 11,
                boxSizing: "border-box",
                tableLayout: "fixed"
              }}>
                <colgroup>
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "19%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "11%" }} />
                  {isSalesTax && <col style={{ width: "9%" }} />}
                  <col style={{ width: isSalesTax ? "9%" : "18%" }} />
                </colgroup>
                <thead>
                  <tr style={{ background: "#F1F5F9", borderBottom: "1px solid #000000" }}>
                    <th style={thStyle}>#</th>
                    <th style={{ ...thStyle, textAlign: "left", paddingLeft: 6 }}>NEWSPAPER</th>
                    <th style={thStyle}>RATE / CM</th>
                    <th style={thStyle}>SIZE</th>
                    <th style={thStyle}>POSITION</th>
                    <th style={thStyle}>PUB. DATE</th>
                    <th style={thStyle}>GROSS (PKR)</th>
                    <th style={thStyle}>15% COMM.</th>
                    {isSalesTax && <th style={thStyle}>15% SST</th>}
                    <th style={thStyle}>NET CHEQUE</th>
                  </tr>
                </thead>
                <tbody>
                  {agencyRows.map((row) => (
                    <tr key={row.id}>
                      <td style={{ ...tdCenter, fontWeight: 700 }}>{row.sno}</td>
                      <td style={{ ...tdLeft, textTransform: "uppercase" }}>{row.newspaper}</td>
                      <td style={tdRight}>{fmtNum(row.rate)}</td>
                      <td style={{ ...tdCenter, fontWeight: 700 }}>{row.size}</td>
                      <td style={{ ...tdCenter, fontSize: 9.5 }}>{row.position || "ORD - B/W"}</td>
                      <td style={tdCenter}>{fmtDateDIPR(row.publishDate)}</td>
                      <td style={tdRight}>{fmtNum(row.gross)}</td>
                      <td style={{ ...tdRight, color: "#047857", fontWeight: 700 }}>{fmtNum(row.comm)}</td>
                      {isSalesTax && <td style={{ ...tdRight, color: "#DC2626" }}>{fmtNum(row.sst)}</td>}
                      <td style={{ ...tdRight, fontWeight: 800 }}>{fmtNum(row.netCheque)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {/* 100% Gross Classified Total */}
                  <tr style={{ fontWeight: 800, background: "#F8FAFC" }}>
                    <td colSpan={6} style={{ border: "1px solid #000000", padding: "7px 10px", textAlign: "right", fontSize: 11 }}>
                      TOTAL 100% GROSS MEDIA BILLING:
                    </td>
                    <td style={{ ...tdRight, fontSize: 11.5, color: "#1E3A8A", fontWeight: 800 }}>
                      {fmtNum(agencyTotals.gross)}
                    </td>
                    <td style={{ ...tdRight, fontSize: 11.5, color: "#047857", fontWeight: 800 }}>
                      {fmtNum(agencyTotals.comm)}
                    </td>
                    {isSalesTax && (
                      <td style={{ ...tdRight, fontSize: 11.5, color: "#DC2626", fontWeight: 800 }}>
                        {fmtNum(agencyTotals.sst)}
                      </td>
                    )}
                    <td style={{ ...tdRight, fontSize: 12, fontWeight: 800, color: "#0F172A" }}>
                      {fmtNum(agencyTotals.netCheque)}
                    </td>
                  </tr>

                  {/* Summary Totals Rows */}
                  <tr>
                    <td colSpan={isSalesTax ? 8 : 7} style={{ border: "1px solid #000000", padding: "6px 12px", textAlign: "right", fontWeight: 800, fontSize: 11.5 }}>
                      15% AGENCY COMMISSION AMOUNT
                    </td>
                    <td colSpan={2} style={{ border: "1px solid #000000", padding: "6px 6px", textAlign: "right", fontWeight: 800, fontSize: 12, color: "#047857" }}>
                      Rs {fmtNum(agencyTotals.comm)}
                    </td>
                  </tr>

                  {isSalesTax && (
                    <tr>
                      <td colSpan={8} style={{ border: "1px solid #000000", padding: "6px 12px", textAlign: "right", fontWeight: 800, fontSize: 11.5, color: "#DC2626" }}>
                        ADD: 15% SINDH SALES TAX (SRB SST ON COMMISSION)
                      </td>
                      <td colSpan={2} style={{ border: "1px solid #000000", padding: "6px 6px", textAlign: "right", fontWeight: 800, fontSize: 12, color: "#DC2626" }}>
                        + Rs {fmtNum(agencyTotals.sst)}
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td colSpan={isSalesTax ? 8 : 7} style={{ border: "1px solid #000000", padding: "6px 12px", textAlign: "right", fontWeight: 800, fontSize: 11.5 }}>
                      TOTAL AGENCY COMMISSION {isSalesTax ? "WITH 15% SST" : ""}
                    </td>
                    <td colSpan={2} style={{ border: "1px solid #000000", padding: "6px 6px", textAlign: "right", fontWeight: 800, fontSize: 12 }}>
                      Rs {fmtNum(agencyTotals.commWithSst)}
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={isSalesTax ? 8 : 7} style={{ border: "1px solid #000000", padding: "6px 12px", textAlign: "right", fontWeight: 800, fontSize: 11.5, color: "#059669" }}>
                      LESS: 10% INCOME TAX WHT WITHHELD AT SOURCE
                    </td>
                    <td colSpan={2} style={{ border: "1px solid #000000", padding: "6px 6px", textAlign: "right", fontWeight: 800, fontSize: 12, color: "#059669" }}>
                      - Rs {fmtNum(agencyTotals.wht)}
                    </td>
                  </tr>

                  <tr style={{ background: "#F1F5F9" }}>
                    <td colSpan={isSalesTax ? 8 : 7} style={{ border: "1.5px solid #000000", padding: "8px 12px", textAlign: "right", fontWeight: 900, fontSize: 12.5, color: "#0F172A" }}>
                      NET AGENCY CHEQUE AMOUNT PAYABLE TO ADPULSE
                    </td>
                    <td colSpan={2} style={{ border: "1.5px solid #000000", padding: "8px 6px", textAlign: "right", fontWeight: 900, fontSize: 13, color: "#0F172A" }}>
                      Rs {fmtNum(agencyTotals.netCheque)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* 4. AMOUNT IN WORDS & SPECIAL NOTES */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{
                  border: "1px solid #000000",
                  padding: "8px 12px",
                  borderRadius: 4,
                  background: "#FAFAFA",
                  fontSize: 11,
                  fontWeight: 700
                }}>
                  <span style={{ color: "#475569", textTransform: "uppercase" }}>Amount in Words:</span>
                  <div style={{ marginTop: 2, fontSize: 11.5, color: "#0F172A" }}>
                    {amountInWordsPk(agencyTotals.netCheque)}
                  </div>
                </div>

                <div style={{
                  border: "1px solid #000000",
                  padding: "8px 12px",
                  borderRadius: 4,
                  background: "#FAFAFA",
                  fontSize: 10.5,
                  lineHeight: 1.4,
                  color: "#334155"
                }}>
                  <div>• PAYMENT TO BE MADE IN FAVOR OF <b>"ADPULSE IMC (PRIVATE) LTD"</b></div>
                  <div>• NTN: A0654656-8 / STRN: SA054896-8</div>
                  <div>• SINDH GOVT. DIPR TARIFF &amp; TAX RULES APPLICABLE</div>
                </div>
              </div>
            </div>

            {/* 5. ERP STANDARD PINNED FOOTER: SIGNATURES & RED GRADIENT BANNER */}
            <div style={{ marginTop: "auto", paddingTop: 16 }}>
              {/* Dual Signatures */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, fontSize: 12, fontWeight: 700 }}>
                <div style={{ textAlign: "center", width: 220 }}>
                  <div style={{ borderTop: "1.5px solid #000000", paddingTop: 4, letterSpacing: "0.3px" }}>
                    ACCOUNTANT SIGNATURE
                  </div>
                </div>
                <div style={{ textAlign: "center", width: 220 }}>
                  <div style={{ borderTop: "1.5px solid #000000", paddingTop: 4, letterSpacing: "0.3px" }}>
                    AUTHORIZED SIGNATURE
                  </div>
                </div>
              </div>

              {/* Footer Brand Banner */}
              <div
                className="invoice-footer-banner"
                style={{
                  background: "#A81C1C",
                  backgroundImage: "linear-gradient(90deg, #A81C1C 0%, #1D3B4E 100%)",
                  color: "#FFFFFF",
                  padding: "8px 14px",
                  borderRadius: 4,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 10.5,
                  fontWeight: 600,
                  boxSizing: "border-box",
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact"
                }}
              >
                <div>📞 +92 21 37526834</div>
                <div>✉️ communication@adpulse.pk | 🌐 www.adpulse.pk</div>
                <div>📍 Office # 213, 2nd Floor, Park Tower, Block 5 Clifton, Karachi.</div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: GOVT 85/15 MEDIA SANCTION & SETTLEMENT SHEET */}
        {/* ========================================================================= */}
        {activeView === "govt-sheet" && (
          <div
            className="print-area"
            style={{
              background: "#ffffff",
              color: "#000000",
              padding: "18px 24px 14px 24px",
              fontFamily: "'Calibri', 'Inter', sans-serif",
              border: "none",
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
              borderRadius: 8,
              position: "relative",
              boxSizing: "border-box",
              width: "100%",
              minHeight: "1050px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            {/* TOP CONTENT */}
            <div>
              {/* 1. ERP STANDARD HEADER */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 16 }}>
                {/* Left: Official AdPulse Logo */}
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <img
                    src="./logo.png"
                    alt="AdPulse Logo"
                    style={{ height: 76, maxHeight: 80, width: "auto", objectFit: "contain" }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>

                {/* Center: Heading */}
                <div style={{ textAlign: "center", padding: "0 10px" }}>
                  <h2 style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 800,
                    textDecoration: "underline",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    color: "#0F172A"
                  }}>
                    GOVT MEDIA SANCTION &amp; SETTLEMENT SHEET
                  </h2>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", marginTop: 2 }}>
                    85% Newspaper Media &amp; 15% Agency Commission Breakdown
                  </div>
                </div>

                {/* Right: Meta Info */}
                <div style={{ textAlign: "right", fontSize: 13.5, fontWeight: 700, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <div style={{ marginBottom: 4 }}>
                    DATE: <span style={{ fontWeight: 600 }}>{fmtDateDIPR(invoice.date)}</span>
                  </div>
                  <div>
                    BILL NO: <span style={{ fontWeight: 800 }}>{invoice.invoiceNo}</span>
                  </div>
                </div>
              </div>

              {/* 2. SANCTION META INFO CARD */}
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 16,
                display: "grid",
                gridTemplateColumns: "1.2fr 1.2fr 1fr",
                gap: 10,
                alignItems: "center",
                background: "#F8FAFC",
                padding: "10px 14px",
                border: "1px solid #000000",
                borderRadius: 6,
                boxSizing: "border-box"
              }}>
                <div style={{ wordBreak: "break-word", textAlign: "left" }}>
                  DEPARTMENT: <span style={{ fontWeight: 700, color: "#0F172A" }}>{(invoice.clientName || invoice.client || "INFORMATION DEPARTMENT / GOVT OF SINDH").toUpperCase()}</span>
                </div>
                <div style={{ wordBreak: "break-word", textAlign: "left" }}>
                  RO #: <span style={{ fontWeight: 700, color: "#0F172A" }}>{invoice.roNumber || "INF/KRY/3215/26"}</span>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 2, fontWeight: 600 }}>
                    {invoice.caption || "NOTICE INVITING BIDS"}
                  </div>
                </div>
                <div style={{ wordBreak: "break-word", textAlign: "right" }}>
                  SANCTION TYPE: <span style={{ fontWeight: 700, color: "#047857" }}>85/15 TARIFF SPLIT</span>
                </div>
              </div>

              {/* 3. 85/15 BREAKDOWN TABLE */}
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: 14,
                border: "1px solid #000000",
                fontSize: 10.5,
                boxSizing: "border-box",
                tableLayout: "fixed"
              }}>
                <colgroup>
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "19%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "11%" }} />
                </colgroup>
                <thead>
                  <tr style={{ background: "#F1F5F9", borderBottom: "1px solid #000000" }}>
                    <th style={thStyle}>#</th>
                    <th style={{ ...thStyle, textAlign: "left", paddingLeft: 6 }}>VENDOR / NEWSPAPER</th>
                    <th style={thStyle}>RATE / CM</th>
                    <th style={thStyle}>SIZE</th>
                    <th style={thStyle}>GROSS (PKR)</th>
                    <th style={thStyle}>85% MEDIA</th>
                    <th style={thStyle}>15% COMM.</th>
                    <th style={thStyle}>15% SST</th>
                    <th style={thStyle}>LESS WHT</th>
                    <th style={thStyle}>NET CHEQUE</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Newspaper Rows */}
                  {govtNewspaperRows.map((row) => (
                    <tr key={row.id}>
                      <td style={{ ...tdCenter, fontWeight: 700 }}>{row.sno}</td>
                      <td style={{ ...tdLeft, textTransform: "uppercase" }}>{row.newspaper}</td>
                      <td style={tdRight}>{fmtNum(row.rate)}</td>
                      <td style={{ ...tdCenter, fontWeight: 700 }}>{row.size}</td>
                      <td style={tdRight}>{fmtInt(row.gross)}</td>
                      <td style={{ ...tdRight, color: "#6D28D9", fontWeight: 700 }}>{fmtInt(row.mediaAmt85)}</td>
                      <td style={tdRight}>{fmtInt(row.comm15)}</td>
                      <td style={tdRight}>0</td>
                      <td style={{ ...tdRight, color: "#DC2626" }}>{fmtInt(row.lessWht)}</td>
                      <td style={{ ...tdRight, fontWeight: 700 }}>{fmtInt(row.netCheque)}</td>
                    </tr>
                  ))}

                  {/* Agency Commission Row */}
                  <tr style={{ background: "#F8FAFC", fontWeight: 700 }}>
                    <td style={{ ...tdCenter, fontWeight: 800 }}>{agencySummaryRow.sno}</td>
                    <td style={{ ...tdLeft, color: "#B45309", fontWeight: 800 }}>{agencySummaryRow.newspaper}</td>
                    <td style={tdCenter}></td>
                    <td style={tdCenter}></td>
                    <td style={tdRight}></td>
                    <td style={tdRight}></td>
                    <td style={{ ...tdRight, color: "#B45309", fontWeight: 800 }}>{fmtInt(agencySummaryRow.comm15)}</td>
                    <td style={{ ...tdRight, color: "#DC2626", fontWeight: 800 }}>{fmtInt(agencySummaryRow.sst)}</td>
                    <td style={{ ...tdRight, color: "#059669", fontWeight: 800 }}>{fmtInt(agencySummaryRow.lessWht)}</td>
                    <td style={{ ...tdRight, color: "#0F172A", fontWeight: 900 }}>{fmtInt(agencySummaryRow.netCheque)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid #000000", fontWeight: 800, background: "#F1F5F9" }}>
                    <td colSpan={4} style={{ border: "1px solid #000000", padding: "7px 8px", textAlign: "center", letterSpacing: 1, fontSize: 11 }}>GRAND TOTAL:</td>
                    <td style={{ ...tdRight, fontWeight: 800, fontSize: 11.5 }}>{fmtInt(govtTotals.gross)}</td>
                    <td style={tdRight}></td>
                    <td style={tdRight}></td>
                    <td style={{ ...tdRight, color: "#DC2626", fontWeight: 800, fontSize: 11.5 }}>{fmtInt(govtTotals.sst)}</td>
                    <td style={tdRight}></td>
                    <td style={{ ...tdRight, fontWeight: 900, color: "#0F172A", fontSize: 12 }}>
                      {fmtInt(govtTotals.netCheque)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Amount in words */}
              <div style={{
                border: "1px solid #000000",
                padding: "8px 12px",
                borderRadius: 4,
                background: "#FAFAFA",
                fontSize: 11,
                fontWeight: 700,
                marginBottom: 16
              }}>
                <span style={{ color: "#475569", textTransform: "uppercase" }}>Total Disbursed Net Amount in Words:</span>
                <div style={{ marginTop: 2, fontSize: 11.5, color: "#0F172A" }}>
                  {amountInWordsPk(govtTotals.netCheque)}
                </div>
              </div>
            </div>

            {/* 4. ERP STANDARD PINNED FOOTER: SIGNATURES & RED GRADIENT BANNER */}
            <div style={{ marginTop: "auto", paddingTop: 16 }}>
              {/* Dual Signatures */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, fontSize: 12, fontWeight: 700 }}>
                <div style={{ textAlign: "center", width: 220 }}>
                  <div style={{ borderTop: "1.5px solid #000000", paddingTop: 4, letterSpacing: "0.3px" }}>
                    AUDIT &amp; ACCOUNTS OFFICER
                  </div>
                </div>
                <div style={{ textAlign: "center", width: 220 }}>
                  <div style={{ borderTop: "1.5px solid #000000", paddingTop: 4, letterSpacing: "0.3px" }}>
                    SANCTIONING AUTHORITY
                  </div>
                </div>
              </div>

              {/* Footer Brand Banner */}
              <div
                className="invoice-footer-banner"
                style={{
                  background: "#A81C1C",
                  backgroundImage: "linear-gradient(90deg, #A81C1C 0%, #1D3B4E 100%)",
                  color: "#FFFFFF",
                  padding: "8px 14px",
                  borderRadius: 4,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 10.5,
                  fontWeight: 600,
                  boxSizing: "border-box",
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact"
                }}
              >
                <div>📞 +92 21 37526834</div>
                <div>✉️ communication@adpulse.pk | 🌐 www.adpulse.pk</div>
                <div>📍 Office # 213, 2nd Floor, Park Tower, Block 5 Clifton, Karachi.</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
