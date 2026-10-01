import React, { useState } from "react";
import { Printer, X, FileText, TableProperties, Check } from "lucide-react";

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
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return d;
  const day = String(dateObj.getDate()).padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[dateObj.getMonth()];
  const yr = String(dateObj.getFullYear()).slice(-2);
  return `${day}-${month}-${yr}`;
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
  return parts.join(" ") + " , only.";
}

export default function GovtInvoicePrintModal({ invoice, onClose }) {
  const [activeView, setActiveView] = useState("agency-invoice"); // "agency-invoice" | "govt-sheet"

  if (!invoice) return null;

  const isSalesTax = invoice.isSalesTaxInvoice !== false;
  const title = isSalesTax ? "SALES TAX INVOICE" : "INVOICE";
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

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal" style={{ width: 1050, maxWidth: "98vw", maxHeight: "96vh", display: "flex", flexDirection: "column", padding: 0, background: "#F1F5F9" }} onClick={e => e.stopPropagation()}>
        {/* Modal Top Bar (Non-Printable) */}
        <div className="no-print" style={{ padding: "12px 18px", background: "#0F172A", color: "#FFFFFF", display: "flex", justifyContent: "space-between", alignItems: "center", borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#F59E0B", display: "flex", alignItems: "center", gap: 6 }}>
              <FileText size={16} /> Government Invoice Document Viewer
            </div>
            {/* View Switcher Tabs */}
            <div style={{ display: "inline-flex", background: "#1E293B", padding: 3, borderRadius: 6 }}>
              <button
                type="button"
                onClick={() => setActiveView("agency-invoice")}
                style={{
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  background: activeView === "agency-invoice" ? "#D97706" : "transparent",
                  color: activeView === "agency-invoice" ? "#FFFFFF" : "#94A3B8"
                }}
              >
                📄 1. AdPulse Sales Tax Invoice
              </button>
              <button
                type="button"
                onClick={() => setActiveView("govt-sheet")}
                style={{
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  background: activeView === "govt-sheet" ? "#D97706" : "transparent",
                  color: activeView === "govt-sheet" ? "#FFFFFF" : "#94A3B8"
                }}
              >
                📑 2. Govt 85/15 Media Sanction Sheet
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 12.5 }} onClick={handlePrint}>
              <Printer size={14} /> Print Document
            </button>
            <button className="btn" style={{ padding: 6, color: "#FFFFFF", borderColor: "#334155" }} onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Document Body (Print Area) */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px", background: "#E2E8F0" }}>
          
          {/* ========================================================================= */}
          {/* VIEW 1: ADPULSE AGENCY SALES TAX INVOICE (Screenshot 1 Format) */}
          {/* ========================================================================= */}
          {activeView === "agency-invoice" && (
            <div className="printable-page" style={{
              background: "#FFFFFF",
              padding: "24px 28px",
              margin: "0 auto",
              maxWidth: 960,
              minHeight: 650,
              color: "#000000",
              fontFamily: "Arial, sans-serif",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              border: "1px solid #CBD5E1"
            }}>
              {/* Center Title */}
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <h2 style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 800,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: "#000000"
                }}>
                  {title}
                </h2>
              </div>

              {/* Header Box 1: Client Name & Invoice/Date */}
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 10 }}>
                {/* Left: Client Name */}
                <div style={{
                  border: "2px solid #000000",
                  padding: "6px 10px",
                  display: "flex",
                  alignItems: "center",
                  minHeight: 38
                }}>
                  <span style={{ fontWeight: 700, fontSize: 11, width: 110, textTransform: "uppercase" }}>CLIENT NAME</span>
                  <span style={{ fontWeight: 700, fontSize: 11.5, borderLeft: "2px solid #000000", paddingLeft: 10, flex: 1 }}>
                    {invoice.clientName || "INFORMATION DEPARTMENT / GOVT OF SINDH"}
                  </span>
                </div>

                {/* Right: Invoice # & Date */}
                <div style={{ border: "2px solid #000000", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                  <div style={{ padding: "4px 8px", borderRight: "2px solid #000000", borderBottom: "1px solid #000000", fontSize: 11, fontWeight: 700 }}>
                    Invoice #
                  </div>
                  <div style={{ padding: "4px 8px", borderBottom: "1px solid #000000", fontSize: 11.5, fontWeight: 700, textAlign: "center" }}>
                    {invoice.invoiceNo}
                  </div>
                  <div style={{ padding: "4px 8px", borderRight: "2px solid #000000", fontSize: 11, fontWeight: 700 }}>
                    Date
                  </div>
                  <div style={{ padding: "4px 8px", fontSize: 11, textAlign: "center" }}>
                    {fmtDateDIPR(invoice.date)}
                  </div>
                </div>
              </div>

              {/* Header Box 2: RO Info & NTN/STN */}
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 18 }}>
                {/* Left: RO No, Date, Caption */}
                <div style={{ border: "2px solid #000000" }}>
                  <div style={{ display: "flex", borderBottom: "1px solid #000000" }}>
                    <span style={{ fontWeight: 700, fontSize: 11, width: 110, padding: "3px 8px" }}>RO. NO:</span>
                    <span style={{ fontWeight: 700, fontSize: 11.5, borderLeft: "2px solid #000000", padding: "3px 10px", flex: 1 }}>
                      {invoice.roNumber || "INF/KRY/3215/26"}
                    </span>
                  </div>
                  <div style={{ display: "flex", borderBottom: "1px solid #000000" }}>
                    <span style={{ fontWeight: 700, fontSize: 11, width: 110, padding: "3px 8px" }}>DATE:</span>
                    <span style={{ fontSize: 11, borderLeft: "2px solid #000000", padding: "3px 10px", flex: 1 }}>
                      {fmtDateDIPR(invoice.roDate)}
                    </span>
                  </div>
                  <div style={{ display: "flex" }}>
                    <span style={{ fontWeight: 700, fontSize: 11, width: 110, padding: "3px 8px" }}>CAPTION:</span>
                    <span style={{ fontWeight: 700, fontSize: 11, borderLeft: "2px solid #000000", padding: "3px 10px", flex: 1, textTransform: "uppercase" }}>
                      {invoice.caption || "NOTICE INVITING BIDS"}
                    </span>
                  </div>
                </div>

                {/* Right: NTN # & STN # */}
                <div style={{ border: "2px solid #000000", display: "grid", gridTemplateRows: "1fr 1fr" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", borderBottom: "1px solid #000000" }}>
                    <div style={{ padding: "4px 8px", borderRight: "2px solid #000000", fontSize: 11, fontWeight: 700 }}>
                      NTN #
                    </div>
                    <div style={{ padding: "4px 8px", fontSize: 11, textAlign: "center", fontWeight: 600 }}>
                      {invoice.ntn || "9031600-2"}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr" }}>
                    <div style={{ padding: "4px 8px", borderRight: "2px solid #000000", fontSize: 11, fontWeight: 700 }}>
                      STN#
                    </div>
                    <div style={{ padding: "4px 8px", fontSize: 11, textAlign: "center", fontWeight: 600 }}>
                      {invoice.stn || "S-9031600-2"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Table (Grid) */}
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "2px solid #000000",
                fontSize: 10.5,
                color: "#000000"
              }}>
                <thead>
                  <tr style={{ background: "#FFFFFF", borderBottom: "2px solid #000000" }}>
                    <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 32, textAlign: "center", fontWeight: 700 }}>S.NO</th>
                    <th style={{ border: "1px solid #000000", padding: "6px 6px", textAlign: "center", fontWeight: 700 }}>NEWSPAPER</th>
                    <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 62, textAlign: "center", fontWeight: 700 }}>RATE PER CM</th>
                    <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 38, textAlign: "center", fontWeight: 700 }}>SIZE</th>
                    <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 68, textAlign: "center", fontWeight: 700 }}>POSITION /STATUS</th>
                    <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 68, textAlign: "center", fontWeight: 700 }}>PUBLISH DATE</th>
                    <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 78, textAlign: "center", fontWeight: 700 }}>NEWSPAPER GROSS AMOUT</th>
                    <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 72, textAlign: "center", fontWeight: 700 }}>15% AGENCY COMMISSION</th>
                    {isSalesTax && (
                      <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 72, textAlign: "center", fontWeight: 700 }}>15% SST ON AGENCY COMMISSION</th>
                    )}
                    <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 74, textAlign: "center", fontWeight: 700 }}>
                      AGENCY COMMISSION {isSalesTax ? "WITH SST" : ""}
                    </th>
                    <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 76, textAlign: "center", fontWeight: 700 }}>
                      LESS 10% WHT ON {isSalesTax ? "15% AGENCY COMMISSION WITH SST" : "COMMISSION"}
                    </th>
                    <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 78, textAlign: "center", fontWeight: 700 }}>NET / CHEQUE AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {agencyRows.map((row) => (
                    <tr key={row.id}>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "center" }}>{row.sno}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 6px", fontWeight: 700, textTransform: "uppercase" }}>{row.newspaper}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right" }}>{fmtNum(row.rate)}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "center" }}>{row.size}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "center", fontSize: 9.5 }}>{row.position || "ORD - B/W"}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "center" }}>{fmtDateDIPR(row.publishDate)}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right" }}>{fmtNum(row.gross)}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right" }}>{fmtNum(row.comm)}</td>
                      {isSalesTax && (
                        <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right" }}>{fmtNum(row.sst)}</td>
                      )}
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right" }}>{fmtNum(row.commWithSst)}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right" }}>{fmtNum(row.wht)}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", fontWeight: 700 }}>{fmtNum(row.netCheque)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid #000000", borderBottom: "3px double #000000", fontWeight: 800 }}>
                    <td colSpan={6} style={{ border: "1px solid #000000", padding: "6px 8px", textAlign: "center", letterSpacing: 1 }}>TOTAL</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", textAlign: "right" }}>{fmtInt(agencyTotals.gross)}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", textAlign: "right" }}>{fmtInt(agencyTotals.comm)}</td>
                    {isSalesTax && (
                      <td style={{ border: "1px solid #000000", padding: "6px 4px", textAlign: "right" }}>{fmtInt(agencyTotals.sst)}</td>
                    )}
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", textAlign: "right" }}>{fmtInt(agencyTotals.commWithSst)}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", textAlign: "right" }}>{fmtInt(agencyTotals.wht)}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", textAlign: "right" }}>{fmtInt(agencyTotals.netCheque)}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Amount In Words */}
              <div style={{
                border: "2px solid #000000",
                borderTop: "none",
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 700
              }}>
                (PKR: {amountInWordsPk(agencyTotals.netCheque)})
              </div>

              {/* Signatures Footer */}
              <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 10px" }}>
                <div style={{ textAlign: "center", width: 180 }}>
                  <div style={{ borderBottom: "1px solid #000000", marginBottom: 4, height: 25 }}></div>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>Prepared By</div>
                </div>
                <div style={{ textAlign: "center", width: 180 }}>
                  <div style={{ borderBottom: "1px solid #000000", marginBottom: 4, height: 25 }}></div>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>Checked &amp; Verified</div>
                </div>
                <div style={{ textAlign: "center", width: 220 }}>
                  <div style={{ borderBottom: "1px solid #000000", marginBottom: 4, height: 25 }}></div>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>For ADPULSE IMC (PVT.) LTD</div>
                  <div style={{ fontSize: 9.5, color: "#64748B" }}>Authorized Signatory</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: GOVT 85/15 MEDIA SANCTION & SETTLEMENT SHEET (Screenshot 2 Format) */}
          {/* ========================================================================= */}
          {activeView === "govt-sheet" && (
            <div className="printable-page" style={{
              background: "#FFFFFF",
              padding: "24px 28px",
              margin: "0 auto",
              maxWidth: 960,
              minHeight: 650,
              color: "#000000",
              fontFamily: "Arial, sans-serif",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              border: "1px solid #CBD5E1"
            }}>
              {/* Center Title */}
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, textTransform: "uppercase" }}>
                  GOVERNMENT MEDIA SANCTION &amp; SETTLEMENT BREAKDOWN SHEET
                </h3>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#334155", marginTop: 2 }}>
                  Department: <b>{invoice.clientName}</b> &middot; RO #: <b>{invoice.roNumber}</b> &middot; Invoice #: <b>{invoice.invoiceNo}</b>
                </div>
              </div>

              {/* Main Govt Breakdown Grid */}
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "2px solid #000000",
                fontSize: 10.5,
                color: "#000000"
              }}>
                <thead>
                  <tr style={{ background: "#FFFFFF", borderBottom: "2px solid #000000" }}>
                    <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 34, textAlign: "center", fontWeight: 700 }}>SNO</th>
                    <th style={{ border: "1px solid #000000", padding: "6px 6px", textAlign: "center", fontWeight: 700 }}>VENDOR / NEWSPAPER</th>
                    <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 65, textAlign: "center", fontWeight: 700 }}>RATE PER CM</th>
                    <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 40, textAlign: "center", fontWeight: 700 }}>SIZE</th>
                    <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 75, textAlign: "center", fontWeight: 700 }}>GROSS AMOUNT</th>
                    <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 75, textAlign: "center", fontWeight: 700 }}>85 % MEDIA AMOUNT</th>
                    <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 75, textAlign: "center", fontWeight: 700 }}>15 % (AGENCY COMMISSION)</th>
                    <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 75, textAlign: "center", fontWeight: 700 }}>*15% SST ON 15% AGENCY COMMISSIO</th>
                    <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 75, textAlign: "center", fontWeight: 700 }}>AGENCY COMMISSIO WITH SST</th>
                    <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 85, textAlign: "center", fontWeight: 700 }}>LESS 1.5 ON 85% M.AMT/ 10% WHT ON A.C. WITH SST</th>
                    <th style={{ border: "1px solid #000000", padding: "6px 4px", width: 78, textAlign: "center", fontWeight: 700 }}>NET/ CHEQUE AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Rows 1 to N: Newspapers */}
                  {govtNewspaperRows.map((row) => (
                    <tr key={row.id}>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "center" }}>{row.sno}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 6px", fontWeight: 700, textTransform: "uppercase" }}>{row.newspaper}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right" }}>{fmtNum(row.rate)}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "center" }}>{row.size}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right" }}>{fmtInt(row.gross)}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right" }}>{fmtInt(row.mediaAmt85)}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right" }}>{fmtInt(row.comm15)}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right" }}>0</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right" }}>{fmtInt(row.commWithSst)}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right" }}>{fmtInt(row.lessWht)}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", fontWeight: 700 }}>{fmtInt(row.netCheque)}</td>
                    </tr>
                  ))}

                  {/* Agency Commission Summary Row (Row N+1) */}
                  <tr style={{ background: "#F8FAFC", fontWeight: 700 }}>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", textAlign: "center" }}>{agencySummaryRow.sno}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 6px", color: "#B45309" }}>{agencySummaryRow.newspaper}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px" }}></td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px" }}></td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px" }}></td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px" }}></td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", textAlign: "right", color: "#B45309" }}>{fmtInt(agencySummaryRow.comm15)}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", textAlign: "right", color: "#0284C7" }}>{fmtInt(agencySummaryRow.sst)}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", textAlign: "right" }}>{fmtInt(agencySummaryRow.commWithSst)}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", textAlign: "right", color: "#DC2626" }}>{fmtInt(agencySummaryRow.lessWht)}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", textAlign: "right", color: "#059669", fontWeight: 800 }}>{fmtInt(agencySummaryRow.netCheque)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid #000000", borderBottom: "3px double #000000", fontWeight: 800 }}>
                    <td colSpan={4} style={{ border: "1px solid #000000", padding: "6px 8px", textAlign: "center", letterSpacing: 1 }}>TOTAL:</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", textAlign: "right" }}>{fmtInt(govtTotals.gross)}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px" }}></td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px" }}></td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", textAlign: "right" }}>{fmtInt(govtTotals.sst)}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px" }}></td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px" }}></td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", textAlign: "right" }}>{fmtInt(govtTotals.netCheque)}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Amount In Words */}
              <div style={{
                border: "2px solid #000000",
                borderTop: "none",
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 700
              }}>
                (PKR: {amountInWordsPk(govtTotals.netCheque)})
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
