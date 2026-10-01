import React, { useState, useMemo } from "react";
import { Plus, Trash2, Printer, Check, X, Building2, FileText, Landmark } from "lucide-react";

/* Helper formatters */
function fmtNum(n) {
  if (n === null || n === undefined || isNaN(n)) return "0.00";
  return Number(n).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtInt(n) {
  if (n === null || n === undefined || isNaN(n)) return "0";
  return Math.round(Number(n)).toLocaleString("en-PK");
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

export default function GovtInvoiceModal({
  initialData = null,
  clients = [],
  govtInvoices = [],
  onClose,
  onSubmit
}) {
  const [clientName, setClientName] = useState(
    initialData?.clientName || initialData?.client || "INFORMATION DEPARTMENT / GOVT OF SINDH"
  );
  const [invoiceNo, setInvoiceNo] = useState(
    initialData?.invoiceNo || `AD-S${Math.floor(Math.random() * 899 + 100)}`
  );
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().slice(0, 10));
  const [roNumber, setRoNumber] = useState(initialData?.roNumber || "INF/KRY/3215/26");
  const [roDate, setRoDate] = useState(initialData?.roDate || new Date().toISOString().slice(0, 10));
  const [caption, setCaption] = useState(initialData?.caption || "NOTICE INVITING BIDS");
  const [ntn, setNtn] = useState(initialData?.ntn || "9031600-2");
  const [stn, setStn] = useState(initialData?.stn || "S-9031600-2");

  // Tax Settings
  const [isSalesTaxInvoice, setIsSalesTaxInvoice] = useState(
    initialData?.isSalesTaxInvoice !== undefined ? initialData.isSalesTaxInvoice : true
  );
  const [agencyCommissionRate, setAgencyCommissionRate] = useState(
    initialData?.agencyCommissionRate !== undefined ? initialData.agencyCommissionRate : 15
  );
  const [sstRate, setSstRate] = useState(
    initialData?.sstRate !== undefined ? initialData.sstRate : 15
  );
  const [whtRate, setWhtRate] = useState(
    initialData?.whtRate !== undefined ? initialData.whtRate : 10
  );
  const [mediaShareRate, setMediaShareRate] = useState(
    initialData?.mediaShareRate !== undefined ? initialData.mediaShareRate : 85
  );
  const [newspaperWhtRate, setNewspaperWhtRate] = useState(
    initialData?.newspaperWhtRate !== undefined ? initialData.newspaperWhtRate : 1.5
  );

  // Newspaper Line Items
  const [items, setItems] = useState(() => {
    if (initialData?.items && Array.isArray(initialData.items) && initialData.items.length > 0) {
      return initialData.items;
    }
    return [
      { id: "1", newspaper: "AAS", ratePerCm: 500.96, size: 130, position: "ORD - B/W", publishDate: new Date().toISOString().slice(0, 10) },
      { id: "2", newspaper: "DAILY TIMES", ratePerCm: 215.24, size: 130, position: "ORD - B/W", publishDate: new Date().toISOString().slice(0, 10) },
      { id: "3", newspaper: "EXPRESS", ratePerCm: 374.05, size: 130, position: "ORD - B/W", publishDate: new Date().toISOString().slice(0, 10) },
      { id: "4", newspaper: "MILLAN", ratePerCm: 504.50, size: 130, position: "ORD - B/W", publishDate: new Date().toISOString().slice(0, 10) },
      { id: "5", newspaper: "MOOMAL", ratePerCm: 404.66, size: 130, position: "ORD - B/W", publishDate: new Date().toISOString().slice(0, 10) },
      { id: "6", newspaper: "PAHENJI AKHBAR", ratePerCm: 511.80, size: 130, position: "ORD - B/W", publishDate: new Date().toISOString().slice(0, 10) },
    ];
  });

  const addItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now().toString(), newspaper: "", ratePerCm: 0, size: 80, position: "ORD - B/W", publishDate: date }
    ]);
  };

  const removeItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, val) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  // Row Calculations
  const calculatedRows = useMemo(() => {
    return items.map((item, idx) => {
      const rate = Number(item.ratePerCm) || 0;
      const size = Number(item.size) || 0;
      const grossAmount = rate * size;

      // 85% Media & 1.5% Newspaper WHT (For Govt Sanction Sheet)
      const mediaAmount85 = grossAmount * (Number(mediaShareRate) / 100);
      const newspaperWht = mediaAmount85 * (Number(newspaperWhtRate) / 100);
      const newspaperNetCheque = mediaAmount85 - newspaperWht;

      // 15% Agency Commission & SST
      const agencyCommission = grossAmount * (Number(agencyCommissionRate) / 100);
      const sstAmount = isSalesTaxInvoice ? agencyCommission * (Number(sstRate) / 100) : 0;
      const agencyCommWithSst = agencyCommission + sstAmount;
      const agencyWht = agencyCommWithSst * (Number(whtRate) / 100);
      const agencyNetCheque = agencyCommWithSst - agencyWht;

      return {
        ...item,
        sno: idx + 1,
        grossAmount,
        mediaAmount85,
        newspaperWht,
        newspaperNetCheque,
        agencyCommission,
        sstAmount,
        agencyCommWithSst,
        agencyWht,
        agencyNetCheque
      };
    });
  }, [items, isSalesTaxInvoice, agencyCommissionRate, sstRate, whtRate, mediaShareRate, newspaperWhtRate]);

  // Totals
  const totals = useMemo(() => {
    return calculatedRows.reduce((acc, row) => {
      acc.grossAmount += row.grossAmount;
      acc.mediaAmount85 += row.mediaAmount85;
      acc.newspaperWht += row.newspaperWht;
      acc.newspaperNetCheque += row.newspaperNetCheque;
      acc.agencyCommission += row.agencyCommission;
      acc.sstAmount += row.sstAmount;
      acc.agencyCommWithSst += row.agencyCommWithSst;
      acc.agencyWht += row.agencyWht;
      acc.agencyNetCheque += row.agencyNetCheque;
      return acc;
    }, {
      grossAmount: 0,
      mediaAmount85: 0,
      newspaperWht: 0,
      newspaperNetCheque: 0,
      agencyCommission: 0,
      sstAmount: 0,
      agencyCommWithSst: 0,
      agencyWht: 0,
      agencyNetCheque: 0
    });
  }, [calculatedRows]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!clientName.trim() || !invoiceNo.trim() || calculatedRows.length === 0) {
      alert("Please fill in Client Name, Invoice # and at least one newspaper item.");
      return;
    }

    const payload = {
      id: initialData?.id || `gov-${Date.now()}`,
      clientName: clientName.trim(),
      invoiceNo: invoiceNo.trim(),
      date,
      roNumber: roNumber.trim(),
      roDate,
      caption: caption.trim(),
      ntn: ntn.trim(),
      stn: stn.trim(),
      isSalesTaxInvoice,
      agencyCommissionRate: Number(agencyCommissionRate),
      sstRate: Number(sstRate),
      whtRate: Number(whtRate),
      mediaShareRate: Number(mediaShareRate),
      newspaperWhtRate: Number(newspaperWhtRate),
      items: calculatedRows.map(r => ({
        id: r.id,
        newspaper: r.newspaper,
        ratePerCm: Number(r.ratePerCm),
        size: Number(r.size),
        position: r.position,
        publishDate: r.publishDate
      })),
      totals,
      totalBilled: isSalesTaxInvoice ? totals.agencyCommWithSst : totals.agencyCommission,
      netReceivable: totals.agencyNetCheque,
      totalGross: totals.grossAmount,
      totalCommission: totals.agencyCommission,
      totalSst: totals.sstAmount,
      totalWht: totals.agencyWht,
      status: initialData?.status || "Unpaid",
      createdAt: initialData?.createdAt || new Date().toISOString()
    };

    onSubmit(payload);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 960, maxWidth: "96vw", maxHeight: "92vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--rule)", paddingBottom: 12, marginBottom: 16 }}>
          <div>
            <div className="section-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Landmark size={20} color="var(--gold)" />
              {initialData ? `Edit Government Invoice #${invoiceNo}` : "Generate Government / DIPR Print Media Invoice"}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>
              Government of Sindh / PID Newspaper Tariff, 85% Media & 15% Agency Commission Calculation System
            </div>
          </div>
          <button className="btn" style={{ padding: 6 }} onClick={onClose}><X size={16} /></button>
        </div>

        {/* Scrollable Body */}
        <div style={{ overflowY: "auto", flex: 1, paddingRight: 6 }}>
          {/* Top Toggle Banner */}
          <div style={{
            background: isSalesTaxInvoice ? "rgba(5, 150, 105, 0.08)" : "rgba(2, 132, 199, 0.08)",
            border: `1.5px solid ${isSalesTaxInvoice ? "var(--emerald)" : "var(--brand)"}`,
            padding: "10px 16px",
            borderRadius: 8,
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="checkbox"
                id="isSalesTaxCheckbox"
                checked={isSalesTaxInvoice}
                onChange={e => setIsSalesTaxInvoice(e.target.checked)}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />
              <label htmlFor="isSalesTaxCheckbox" style={{ fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--ink)", margin: 0 }}>
                {isSalesTaxInvoice ? "✅ SALES TAX INVOICE (With 15% SST Applied)" : "📄 COMMERCIAL INVOICE (No SST / Tax Box Unchecked)"}
              </label>
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", fontWeight: 600 }}>
              Header Title: <strong style={{ color: isSalesTaxInvoice ? "var(--emerald)" : "var(--brand)" }}>
                {isSalesTaxInvoice ? "SALES TAX INVOICE" : "INVOICE"}
              </strong>
            </div>
          </div>

          {/* Invoice & RO Meta Fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12, marginBottom: 12 }}>
            <div className="card" style={{ padding: 12, margin: 0 }}>
              <div className="field" style={{ margin: "0 0 10px 0" }}>
                <label>Client / Government Department Name *</label>
                <input
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="e.g. INFORMATION DEPARTMENT / GOVT OF SINDH"
                  style={{ fontWeight: 700 }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label>RO. NO: (Release Order #) *</label>
                  <input
                    value={roNumber}
                    onChange={e => setRoNumber(e.target.value)}
                    placeholder="e.g. INF/KRY/3215/26"
                    style={{ fontWeight: 600 }}
                  />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>RO Date *</label>
                  <input type="date" value={roDate} onChange={e => setRoDate(e.target.value)} />
                </div>
              </div>
              <div className="field" style={{ margin: "10px 0 0 0" }}>
                <label>Caption / Subject *</label>
                <input
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="e.g. NOTICE INVITING BIDS / TENDER NOTICE"
                />
              </div>
            </div>

            <div className="card" style={{ padding: 12, margin: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10, marginBottom: 10 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label>Invoice # *</label>
                  <input
                    value={invoiceNo}
                    onChange={e => setInvoiceNo(e.target.value)}
                    placeholder="e.g. AD-S372"
                    style={{ fontWeight: 700, color: "var(--gold)" }}
                  />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>Invoice Date *</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label>Client NTN #</label>
                  <input value={ntn} onChange={e => setNtn(e.target.value)} placeholder="e.g. 9031600-2" />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>Client STN / STRN #</label>
                  <input value={stn} onChange={e => setStn(e.target.value)} placeholder="e.g. S-9031600-2" />
                </div>
              </div>

              {/* Rates Settings Strip */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, background: "var(--bg)", padding: "6px 8px", borderRadius: 6, fontSize: 11 }}>
                <div>
                  <label style={{ fontSize: 10 }}>Agency Comm %</label>
                  <input
                    type="number"
                    value={agencyCommissionRate}
                    onChange={e => setAgencyCommissionRate(e.target.value)}
                    style={{ padding: "3px 6px", fontSize: 11 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10 }}>SST Tax %</label>
                  <input
                    type="number"
                    value={sstRate}
                    onChange={e => setSstRate(e.target.value)}
                    disabled={!isSalesTaxInvoice}
                    style={{ padding: "3px 6px", fontSize: 11, opacity: isSalesTaxInvoice ? 1 : 0.5 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10 }}>Govt WHT %</label>
                  <input
                    type="number"
                    value={whtRate}
                    onChange={e => setWhtRate(e.target.value)}
                    style={{ padding: "3px 6px", fontSize: 11 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Newspapers Multi-Row Grid Table */}
          <div className="card" style={{ padding: 12, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)", display: "flex", alignItems: "center", gap: 6 }}>
                <span>📰 Newspaper Ad Insertions ({calculatedRows.length})</span>
              </div>
              <button type="button" className="btn btn-primary" style={{ padding: "4px 10px", fontSize: 12 }} onClick={addItem}>
                <Plus size={13} /> Add Newspaper Row
              </button>
            </div>

            <div className="table-responsive">
              <table style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ width: 35 }}>#</th>
                    <th>Newspaper Name *</th>
                    <th style={{ width: 100, textAlign: "right" }}>Rate / CM (PKR)</th>
                    <th style={{ width: 70, textAlign: "right" }}>Size (CM)</th>
                    <th style={{ width: 110 }}>Position / Status</th>
                    <th style={{ width: 110 }}>Publish Date</th>
                    <th style={{ textAlign: "right" }}>Gross (PKR)</th>
                    <th style={{ textAlign: "right" }}>15% Comm</th>
                    {isSalesTaxInvoice && <th style={{ textAlign: "right" }}>15% SST</th>}
                    <th style={{ textAlign: "right", color: "var(--emerald)" }}>Net Cheque</th>
                    <th style={{ width: 35 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedRows.map((row, idx) => (
                    <tr key={row.id}>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>{row.sno}</td>
                      <td>
                        <input
                          value={row.newspaper}
                          onChange={e => updateItem(idx, "newspaper", e.target.value)}
                          placeholder="e.g. AAS, JANG, EXPRESS..."
                          style={{ padding: "4px 6px", fontSize: 12, fontWeight: 600 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={row.ratePerCm}
                          onChange={e => updateItem(idx, "ratePerCm", e.target.value)}
                          style={{ padding: "4px 6px", fontSize: 12, textAlign: "right", fontWeight: 600 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.size}
                          onChange={e => updateItem(idx, "size", e.target.value)}
                          style={{ padding: "4px 6px", fontSize: 12, textAlign: "right" }}
                        />
                      </td>
                      <td>
                        <input
                          value={row.position}
                          onChange={e => updateItem(idx, "position", e.target.value)}
                          placeholder="ORD - B/W"
                          style={{ padding: "4px 6px", fontSize: 11.5 }}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          value={row.publishDate}
                          onChange={e => updateItem(idx, "publishDate", e.target.value)}
                          style={{ padding: "4px 6px", fontSize: 11.5 }}
                        />
                      </td>
                      <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>
                        {fmtNum(row.grossAmount)}
                      </td>
                      <td className="mono" style={{ textAlign: "right", color: "var(--gold)" }}>
                        {fmtNum(row.agencyCommission)}
                      </td>
                      {isSalesTaxInvoice && (
                        <td className="mono" style={{ textAlign: "right", color: "var(--primary)" }}>
                          {fmtNum(row.sstAmount)}
                        </td>
                      )}
                      <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: "var(--emerald)" }}>
                        {fmtNum(row.agencyNetCheque)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {calculatedRows.length > 1 && (
                          <button
                            type="button"
                            className="btn"
                            style={{ padding: 4, color: "var(--rose)", border: "none", background: "transparent" }}
                            onClick={() => removeItem(idx)}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 800, background: "var(--bg)", borderTop: "2px solid var(--rule)" }}>
                    <td colSpan={6} style={{ textAlign: "right" }}>TOTAL:</td>
                    <td className="mono" style={{ textAlign: "right" }}>{fmtInt(totals.grossAmount)}</td>
                    <td className="mono" style={{ textAlign: "right", color: "var(--gold)" }}>{fmtInt(totals.agencyCommission)}</td>
                    {isSalesTaxInvoice && (
                      <td className="mono" style={{ textAlign: "right", color: "var(--primary)" }}>{fmtInt(totals.sstAmount)}</td>
                    )}
                    <td className="mono" style={{ textAlign: "right", color: "var(--emerald)", fontSize: 13 }}>{fmtInt(totals.agencyNetCheque)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-muted)", fontStyle: "italic" }}>
              Amount in words: <strong style={{ color: "var(--ink)", fontStyle: "normal" }}>
                (PKR: {amountInWordsPk(isSalesTaxInvoice ? totals.agencyNetCheque : totals.agencyCommission)})
              </strong>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ borderTop: "1px solid var(--rule)", paddingTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            <Check size={14} /> Save &amp; Generate Government Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
