import React, { useMemo } from "react";
import { FolderKanban, DollarSign, TrendingUp, ArrowDownRight, ArrowUpRight, FileCheck, Truck, Receipt, CheckCircle, Clock } from "lucide-react";
import { cleanInvoiceNo } from "../App.jsx";

export default function ProjectFinancialDashboard({
  project,
  invoices = [],
  expenses = [],
  vouchers = [],
  vendors = [],
  onOpenTransaction
}) {
  if (!project) return null;

  // Filter project transactions
  const projectInvoices = useMemo(() => invoices.filter(i => i.projectId === project.id), [invoices, project]);
  const projectExpenses = useMemo(() => expenses.filter(e => e.projectId === project.id), [expenses, project]);
  const projectReceipts = useMemo(() => vouchers.filter(v => v.projectId === project.id && v.type === "RV"), [vouchers, project]);
  const projectPayments = useMemo(() => vouchers.filter(v => v.projectId === project.id && v.type === "PV"), [vouchers, project]);

  // Financial Calculations
  const projectValue = Number(project.contractValue || project.budget) || 0;
  const totalInvoiced = projectInvoices.reduce((s, i) => s + (Number(i.totalAmount || i.amount) || 0), 0);
  const totalReceived = projectReceipts.reduce((s, v) => s + (Number(v.amount) || 0), 0);
  const clientOutstanding = totalInvoiced - totalReceived;

  const totalExpense = projectExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const projectProfit = totalInvoiced - totalExpense;
  const profitMargin = totalInvoiced > 0 ? (projectProfit / totalInvoiced) * 100 : 0;

  // Vendor Cost Breakdown for this Project
  const vendorCosts = useMemo(() => {
    const vendorMap = {};
    projectExpenses.forEach(exp => {
      const vName = exp.vendor || "Other Vendor";
      if (!vendorMap[vName]) {
        vendorMap[vName] = { vendor: vName, expense: 0, payment: 0 };
      }
      vendorMap[vName].expense += Number(exp.amount) || 0;
    });

    projectPayments.forEach(p => {
      const vName = p.party || "Other Vendor";
      if (!vendorMap[vName]) {
        vendorMap[vName] = { vendor: vName, expense: 0, payment: 0 };
      }
      vendorMap[vName].payment += Number(p.amount) || 0;
    });

    return Object.values(vendorMap).map(v => ({
      ...v,
      outstanding: v.expense - v.payment
    }));
  }, [projectExpenses, projectPayments]);

  // Activity Timeline
  const activityList = useMemo(() => {
    const list = [
      ...projectInvoices.map(i => ({ date: i.issueDate, type: "Invoice", ref: cleanInvoiceNo(i.invoiceNo || i.id), party: i.client_name || i.client, debit: Number(i.totalAmount || i.amount) || 0, credit: 0, raw: i })),
      ...projectReceipts.map(r => ({ date: r.date, type: "Receipt", ref: r.voucherNo || ("RV-" + r.id.toUpperCase()), party: r.party, debit: 0, credit: Number(r.amount) || 0, raw: r })),
      ...projectExpenses.map(e => ({ date: e.date, type: "Expense", ref: e.expenseNo || ("EXP-" + e.id.toUpperCase()), party: e.vendor, debit: 0, credit: Number(e.amount) || 0, raw: e })),
      ...projectPayments.map(p => ({ date: p.date, type: "Payment", ref: p.voucherNo || ("PV-" + p.id.toUpperCase()), party: p.party, debit: Number(p.amount) || 0, credit: 0, raw: p }))
    ];
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    return list;
  }, [projectInvoices, projectReceipts, projectExpenses, projectPayments]);

  const pkr = (val) => "PKR " + (Number(val) || 0).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div style={{ padding: "10px 0" }}>
      {/* FINANCIAL SUMMARY CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "var(--card-bg)", padding: 14, borderRadius: 10, border: "1px solid var(--rule)" }}>
          <div style={{ fontSize: 12, color: "var(--ink-muted)", fontWeight: 600 }}>Project Value</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#1E293B", marginTop: 4 }}>{pkr(projectValue)}</div>
          <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 4 }}>Client: <strong>{project.client}</strong></div>
        </div>

        <div style={{ background: "var(--card-bg)", padding: 14, borderRadius: 10, border: "1px solid var(--rule)" }}>
          <div style={{ fontSize: 12, color: "var(--ink-muted)", fontWeight: 600 }}>Total Invoiced</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#0284C7", marginTop: 4 }}>{pkr(totalInvoiced)}</div>
          <div style={{ fontSize: 11, color: "#059669", marginTop: 4 }}>Received: {pkr(totalReceived)}</div>
        </div>

        <div style={{ background: "var(--card-bg)", padding: 14, borderRadius: 10, border: "1px solid var(--rule)" }}>
          <div style={{ fontSize: 12, color: "var(--ink-muted)", fontWeight: 600 }}>Total Project Expenses</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#D97706", marginTop: 4 }}>{pkr(totalExpense)}</div>
          <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 4 }}>{projectExpenses.length} Expense Items</div>
        </div>

        <div style={{ background: projectProfit >= 0 ? "rgba(5, 150, 105, 0.08)" : "#FEF2F2", padding: 14, borderRadius: 10, border: projectProfit >= 0 ? "1.5px solid #059669" : "1.5px solid #FCA5A5" }}>
          <div style={{ fontSize: 12, color: projectProfit >= 0 ? "#047857" : "#991B1B", fontWeight: 700 }}>Project Profit &amp; Margin</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: projectProfit >= 0 ? "#059669" : "#DC2626", marginTop: 4 }}>
            {pkr(projectProfit)} <span style={{ fontSize: 13, fontWeight: 700 }}>({profitMargin.toFixed(1)}%)</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 4 }}>Revenue &minus; Costs</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
        {/* VENDOR COSTS BREAKDOWN */}
        <div className="card" style={{ padding: 0, borderRadius: 10, overflow: "hidden", border: "1px solid var(--rule)" }}>
          <div style={{ padding: "12px 16px", background: "var(--table-header-bg)", borderBottom: "1px solid var(--rule)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ margin: 0, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <Truck size={16} color="#D97706" /> Vendor Costs &amp; Payables
            </h4>
            <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{vendorCosts.length} Vendors</span>
          </div>

          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Vendor</th>
                <th style={{ textAlign: "right" }}>Expense (PKR)</th>
                <th style={{ textAlign: "right" }}>Paid (PKR)</th>
                <th style={{ textAlign: "right" }}>Outstanding (PKR)</th>
              </tr>
            </thead>
            <tbody>
              {vendorCosts.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: 20, color: "var(--ink-muted)" }}>No vendor expenses logged for this project.</td>
                </tr>
              ) : (
                vendorCosts.map((vc, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{vc.vendor}</td>
                    <td style={{ textAlign: "right", color: "#D97706" }}>{pkr(vc.expense)}</td>
                    <td style={{ textAlign: "right", color: "#059669" }}>{pkr(vc.payment)}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: vc.outstanding > 0 ? "#DC2626" : "#059669" }}>{pkr(vc.outstanding)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FINANCIAL ACTIVITY LOG */}
        <div className="card" style={{ padding: 0, borderRadius: 10, overflow: "hidden", border: "1px solid var(--rule)" }}>
          <div style={{ padding: "12px 16px", background: "var(--table-header-bg)", borderBottom: "1px solid var(--rule)" }}>
            <h4 style={{ margin: 0, fontSize: 14 }}>Project Financial Activity</h4>
          </div>

          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {activityList.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "var(--ink-muted)", fontSize: 12 }}>No transactions yet.</div>
            ) : (
              activityList.map((act, idx) => (
                <div key={idx} style={{ padding: "10px 14px", borderBottom: "1px solid var(--rule)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--ink)" }}>{act.ref} &middot; <span style={{ fontWeight: 400, color: "var(--ink-muted)" }}>{act.type}</span></div>
                    <div style={{ color: "var(--ink-muted)", fontSize: 11 }}>{act.party} &middot; {act.date}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: act.debit > 0 ? "#0284C7" : "#059669" }}>
                    {act.debit > 0 ? pkr(act.debit) : pkr(act.credit)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
