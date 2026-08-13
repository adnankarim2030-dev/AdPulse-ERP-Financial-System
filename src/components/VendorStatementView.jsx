import React, { useState, useMemo, useEffect } from "react";
import { Printer, Download, Filter, Truck } from "lucide-react";

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

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!selectedVendor) return;
    let csv = `Vendor Statement - ${selectedVendor.name}\n`;
    csv += `Period: ${dateFrom} to ${dateTo}\n`;
    csv += `Opening Payable,${statementData.openingPayable}\n\n`;
    csv += `Date,Reference,Type,Project,Debit / Payment (PKR),Credit / Expense (PKR),Payable Balance (PKR)\n`;

    statementData.rows.forEach(r => {
      csv += `${r.date},"${r.ref}","${r.type}","${r.project}",${r.debit},${r.credit},${r.runningBalance}\n`;
    });

    csv += `\nClosing Payable,,,,,${statementData.closingPayable}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Vendor_Statement_${selectedVendor.name.replace(/\s+/g, "_")}_${dateFrom}_to_${dateTo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                  {v.vendorCode || v.id} &mdash; {v.name} ({v.companyName || "No Company"})
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
          <button className="btn" onClick={handleExportCSV} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <Download size={15} /> Export CSV / Excel
          </button>
          <button className="btn btn-primary" onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "#D97706", borderColor: "#D97706" }}>
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
                  <td>&mdash;</td>
                  <td style={{ textAlign: "right" }}>&mdash;</td>
                  <td style={{ textAlign: "right" }}>&mdash;</td>
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
                        {row.debit > 0 ? pkr(row.debit) : "&mdash;"}
                      </td>
                      <td style={{ textAlign: "right", color: row.credit > 0 ? "#D97706" : "inherit", fontWeight: row.credit > 0 ? 700 : 400 }}>
                        {row.credit > 0 ? pkr(row.credit) : "&mdash;"}
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
    </div>
  );
}
