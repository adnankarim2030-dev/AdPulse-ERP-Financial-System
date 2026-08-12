import React, { useState, useMemo } from "react";
import { User, Clock, Shield, CheckCircle, FileText, ArrowLeft, Activity } from "lucide-react";

export default function StaffAuditTimeline({
  usersList = [],
  auditLogs = [],
  invoices = [],
  expenses = [],
  vouchers = [],
  documents = [],
  projects = [],
  selectedStaffUser,
  onBack
}) {
  const [activeStaffId, setActiveStaffId] = useState(selectedStaffUser?.id || (usersList[0]?.id || ""));

  const selectedStaff = useMemo(() => {
    return usersList.find(u => u.id === activeStaffId) || usersList[0] || null;
  }, [usersList, activeStaffId]);

  // Non-vanity activity metrics for all staff members
  const staffMetrics = useMemo(() => {
    return usersList.map(u => {
      const uNameNorm = u.name.toLowerCase();

      const userInvoices = invoices.filter(i => (i.createdBy && i.createdBy.toLowerCase() === uNameNorm));
      const userExpenses = expenses.filter(e => (e.createdBy && e.createdBy.toLowerCase() === uNameNorm));
      const userVouchers = vouchers.filter(v => (v.createdBy && v.createdBy.toLowerCase() === uNameNorm) || (v.postedBy && v.postedBy.toLowerCase() === uNameNorm));
      const userDocs = documents.filter(d => (d.uploadedBy && d.uploadedBy.toLowerCase() === uNameNorm));
      const userLogs = auditLogs.filter(l => l.userName && l.userName.toLowerCase() === uNameNorm);

      const txCreated = userInvoices.length + userExpenses.length + userVouchers.filter(v => v.createdBy?.toLowerCase() === uNameNorm).length;
      const txPosted = userVouchers.filter(v => v.postedBy?.toLowerCase() === uNameNorm).length;

      const totalVal = userInvoices.reduce((s, i) => s + (Number(i.totalAmount || i.amount) || 0), 0) +
                       userExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

      const lastLog = userLogs.length > 0 ? userLogs[0].timestamp : null;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        txCreated,
        txPosted,
        txValue: totalVal,
        docsProcessed: userDocs.length,
        auditCount: userLogs.length,
        lastActivity: lastLog ? new Date(lastLog).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently active"
      };
    });
  }, [usersList, invoices, expenses, vouchers, documents, auditLogs]);

  // Selected Staff Detailed Timeline & Breakdown
  const selectedTimeline = useMemo(() => {
    if (!selectedStaff) return [];
    const uNameNorm = selectedStaff.name.toLowerCase();
    return auditLogs.filter(l => l.userName && l.userName.toLowerCase() === uNameNorm);
  }, [selectedStaff, auditLogs]);

  const selectedStaffStats = useMemo(() => {
    if (!selectedStaff) return null;
    return staffMetrics.find(m => m.id === selectedStaff.id);
  }, [selectedStaff, staffMetrics]);

  const pkr = (val) => "PKR " + (Number(val) || 0).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div style={{ padding: "10px 0" }}>
      {/* STAFF SUMMARY TABLE */}
      <div className="card" style={{ padding: 0, borderRadius: 10, overflow: "hidden", border: "1px solid var(--rule)", marginBottom: 20 }}>
        <div style={{ padding: "12px 16px", background: "var(--table-header-bg)", borderBottom: "1px solid var(--rule)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ margin: 0, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <Activity size={16} color="#0284C7" /> Executive Staff Productivity &amp; Audit Overview
          </h4>
          <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>Non-Vanity Operational Metrics</span>
        </div>

        <table className="table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Role / Dept</th>
              <th style={{ textAlign: "center" }}>Tx Created</th>
              <th style={{ textAlign: "center" }}>Tx Posted</th>
              <th style={{ textAlign: "right" }}>Total Value</th>
              <th style={{ textAlign: "center" }}>Docs Reviewed</th>
              <th>Last Activity</th>
              <th style={{ textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {staffMetrics.map((sm) => (
              <tr key={sm.id} className={selectedStaff?.id === sm.id ? "table-active" : ""}>
                <td style={{ fontWeight: 700 }}>{sm.name}</td>
                <td><span className="badge">{sm.role} &middot; {sm.department}</span></td>
                <td style={{ textAlign: "center", fontWeight: 700 }}>{sm.txCreated}</td>
                <td style={{ textAlign: "center", fontWeight: 700, color: "#059669" }}>{sm.txPosted}</td>
                <td style={{ textAlign: "right", fontWeight: 800, color: "#0284C7" }}>{pkr(sm.txValue)}</td>
                <td style={{ textAlign: "center" }}>{sm.docsProcessed}</td>
                <td style={{ fontSize: 12, color: "var(--ink-muted)" }}>{sm.lastActivity}</td>
                <td style={{ textAlign: "center" }}>
                  <button className="btn" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => setActiveStaffId(sm.id)}>
                    View Audit Trail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SELECTED STAFF AUDIT DRILLDOWN */}
      {selectedStaff && (
        <div className="card" style={{ padding: 20, borderRadius: 12, border: "1.5px solid #0284C7", background: "var(--card-bg)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid var(--rule)", paddingBottom: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18 }}>Staff Audit Timeline: {selectedStaff.name}</h3>
              <p style={{ margin: 0, fontSize: 12, color: "var(--ink-muted)" }}>{selectedStaff.role} &middot; {selectedStaff.department} ({selectedStaff.email})</p>
            </div>
            {selectedStaffStats && (
              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Transactions Created</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0284C7" }}>{selectedStaffStats.txCreated}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Total Value</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#059669" }}>{pkr(selectedStaffStats.txValue)}</div>
                </div>
              </div>
            )}
          </div>

          <h4 style={{ fontSize: 14, margin: "0 0 12px 0", color: "var(--ink)" }}>Chronological Activity History</h4>

          <div style={{ position: "relative", paddingLeft: 20 }}>
            <div style={{ position: "absolute", left: 7, top: 4, bottom: 4, width: 2, background: "var(--rule)" }} />

            {selectedTimeline.length === 0 ? (
              <div style={{ padding: 14, color: "var(--ink-muted)", fontSize: 13 }}>No recent detailed audit log entries for this user. Default system actions recorded.</div>
            ) : (
              selectedTimeline.map((log, idx) => (
                <div key={idx} style={{ position: "relative", marginBottom: 14, paddingLeft: 14 }}>
                  <div style={{ position: "absolute", left: -18, top: 3, width: 10, height: 10, borderRadius: "50%", background: "#0284C7" }} />
                  <div style={{ background: "var(--bg)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--rule)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>{log.action}</span>
                      <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>
                      Module: <strong>{log.module}</strong> &middot; Record Type: {log.recordType || "N/A"} (ID: {log.recordId || "N/A"})
                    </div>
                    {log.newValue && (
                      <div style={{ background: "var(--card-bg)", padding: 6, borderRadius: 4, marginTop: 6, fontSize: 11, fontFamily: "monospace" }}>
                        {JSON.stringify(log.newValue)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
