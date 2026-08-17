import React, { useState, useMemo, useEffect } from "react";
import { Printer, Download, Filter, FileText, Calendar, Building2, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { cleanInvoiceNo } from "../App.jsx";

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
    const clientCodeNorm = (selectedClient.clientCode || selectedClient.id || "").toLowerCase();

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

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!selectedClient) return;
    let csv = `Client Statement - ${selectedClient.name}\n`;
    csv += `Period: ${dateFrom} to ${dateTo}\n`;
    csv += `Opening Balance,${statementData.openingBalance}\n\n`;
    csv += `Date,Reference,Type,Project,Debit (PKR),Credit (PKR),Balance (PKR)\n`;

    statementData.rows.forEach(r => {
      csv += `${r.date},"${r.ref}","${r.type}","${r.project}",${r.debit},${r.credit},${r.runningBalance}\n`;
    });

    csv += `\nClosing Outstanding,,,,,${statementData.closingBalance}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Client_Statement_${selectedClient.name.replace(/\s+/g, "_")}_${dateFrom}_to_${dateTo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                  {c.clientCode || c.id} &mdash; {c.name} ({c.companyName || "No Company"})
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
          <button className="btn" onClick={handleExportCSV} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <Download size={15} /> Export CSV / Excel
          </button>
          <button className="btn btn-primary" onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
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
                <div style={{ fontSize: 11, color: "#B45309", fontWeight: 700 }}>1 &ndash; 30 Days Overdue</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#B45309", marginTop: 2 }}>{pkr(agingReport.days30)}</div>
              </div>
              <div style={{ background: "rgba(234, 88, 12, 0.08)", padding: 10, borderRadius: 6, border: "1px solid rgba(234, 88, 12, 0.3)" }}>
                <div style={{ fontSize: 11, color: "#C2410C", fontWeight: 700 }}>31 &ndash; 60 Days Overdue</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#C2410C", marginTop: 2 }}>{pkr(agingReport.days60)}</div>
              </div>
              <div style={{ background: "rgba(225, 29, 72, 0.08)", padding: 10, borderRadius: 6, border: "1px solid rgba(225, 29, 72, 0.3)" }}>
                <div style={{ fontSize: 11, color: "#BE123C", fontWeight: 700 }}>61 &ndash; 90 Days Overdue</div>
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
                  <td>&mdash;</td>
                  <td style={{ textAlign: "right" }}>&mdash;</td>
                  <td style={{ textAlign: "right" }}>&mdash;</td>
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
                        {row.debit > 0 ? pkr(row.debit) : "&mdash;"}
                      </td>
                      <td style={{ textAlign: "right", color: row.credit > 0 ? "#059669" : "inherit", fontWeight: row.credit > 0 ? 700 : 400 }}>
                        {row.credit > 0 ? pkr(row.credit) : "&mdash;"}
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
    </div>
  );
}
