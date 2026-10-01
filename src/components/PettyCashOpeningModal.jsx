import React, { useState } from "react";
import { X, DollarSign, Landmark, Plus, Check, Wallet, Building2 } from "lucide-react";

export default function PettyCashOpeningModal({ bankAccounts = [], onSaveBalances, onAddNewVault, onClose }) {
  // Initialize balances map with current opening balances
  const [balances, setBalances] = useState(() => {
    const map = {};
    bankAccounts.forEach(b => {
      map[b.id] = b.openingBalance !== undefined ? b.openingBalance : 0;
    });
    return map;
  });

  const [activeTab, setActiveTab] = useState("all"); // "all", "cash", "bank"
  const [showNewVaultInline, setShowNewVaultInline] = useState(false);
  const [newVaultName, setNewVaultName] = useState("");
  const [newVaultLocation, setNewVaultLocation] = useState("");
  const [newVaultBalance, setNewVaultBalance] = useState("");

  const pettyCashList = bankAccounts.filter(b => b.accountType === "Petty Cash" || b.id.startsWith("bank-cash"));
  const bankList = bankAccounts.filter(b => b.accountType !== "Petty Cash" && !b.id.startsWith("bank-cash"));

  const filteredAccounts = bankAccounts.filter(b => {
    if (activeTab === "cash") return b.accountType === "Petty Cash" || b.id.startsWith("bank-cash");
    if (activeTab === "bank") return b.accountType !== "Petty Cash" && !b.id.startsWith("bank-cash");
    return true;
  });

  const handleBalanceChange = (id, val) => {
    setBalances(prev => ({
      ...prev,
      [id]: val === "" ? "" : Number(val)
    }));
  };

  const handleSaveAll = () => {
    const updatedAccounts = bankAccounts.map(b => ({
      ...b,
      openingBalance: balances[b.id] !== undefined && balances[b.id] !== "" ? Number(balances[b.id]) || 0 : (b.openingBalance || 0)
    }));
    onSaveBalances(updatedAccounts);
    onClose();
  };

  const handleCreateVault = () => {
    if (!newVaultName.trim()) return;
    const newVault = {
      bankName: newVaultName.trim(),
      accountTitle: newVaultName.trim() + " Vault",
      accountNumber: "PC-" + Math.floor(1000 + Math.random() * 9000),
      iban: "N/A (Cash in Hand)",
      accountType: "Petty Cash",
      branch: newVaultLocation.trim() || "Main Office",
      openingBalance: Number(newVaultBalance) || 0,
      color: "#D97706"
    };
    onAddNewVault(newVault);
    setShowNewVaultInline(false);
    setNewVaultName("");
    setNewVaultLocation("");
    setNewVaultBalance("");
  };

  const fmtPkr = (val) => {
    const n = Number(val) || 0;
    return "Rs " + n.toLocaleString("en-PK", { maximumFractionDigits: 0 });
  };

  const totalOpeningCash = pettyCashList.reduce((s, b) => s + (Number(balances[b.id]) || 0), 0);
  const totalOpeningBank = bankList.reduce((s, b) => s + (Number(balances[b.id]) || 0), 0);
  const grandTotalOpening = totalOpeningCash + totalOpeningBank;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)",
      backdropFilter: "blur(6px)", zIndex: 9999, display: "flex",
      alignItems: "center", justifyContent: "center", padding: 16
    }}>
      <div style={{
        background: "var(--panel-bg, #ffffff)",
        color: "var(--ink, #0f172a)",
        width: "100%",
        maxWidth: 720,
        maxHeight: "90vh",
        borderRadius: 12,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid var(--rule, #e2e8f0)"
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--rule, #e2e8f0)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg, #f8fafc)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "rgba(217, 119, 6, 0.12)", color: "#D97706",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Wallet size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ink, #0f172a)" }}>
                Petty Cash &amp; Bank Opening Balances
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "var(--ink-muted, #64748b)" }}>
                Enter initial starting balances for your cash vaults &amp; bank accounts. Automatically posts to GL Owner's Equity.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--ink-muted, #64748b)", padding: 6, borderRadius: 6
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Summary Metric Strip */}
        <div style={{
          padding: "12px 20px",
          background: "rgba(217, 119, 6, 0.05)",
          borderBottom: "1px solid rgba(217, 119, 6, 0.15)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1.2fr",
          gap: 12
        }}>
          <div style={{ padding: "8px 12px", background: "var(--panel-bg, #fff)", borderRadius: 8, border: "1px solid var(--rule, #e2e8f0)" }}>
            <div style={{ fontSize: 11, color: "#D97706", fontWeight: 600 }}>💵 Total Petty Cash Opening</div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>{fmtPkr(totalOpeningCash)}</div>
          </div>
          <div style={{ padding: "8px 12px", background: "var(--panel-bg, #fff)", borderRadius: 8, border: "1px solid var(--rule, #e2e8f0)" }}>
            <div style={{ fontSize: 11, color: "#0284C7", fontWeight: 600 }}>🏦 Total Bank Opening</div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>{fmtPkr(totalOpeningBank)}</div>
          </div>
          <div style={{ padding: "8px 12px", background: "var(--panel-bg, #fff)", borderRadius: 8, border: "1px solid var(--rule, #e2e8f0)" }}>
            <div style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>✨ Combined Starting Liquidity</div>
            <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "monospace", color: "#059669" }}>{fmtPkr(grandTotalOpening)}</div>
          </div>
        </div>

        {/* Filter Tabs & Quick Add Button */}
        <div style={{
          padding: "10px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--rule, #e2e8f0)",
          background: "var(--bg, #f8fafc)"
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="btn"
              style={{
                fontSize: 12, padding: "4px 10px",
                background: activeTab === "all" ? "var(--ink, #0f172a)" : "transparent",
                color: activeTab === "all" ? "#fff" : "var(--ink, #0f172a)",
                borderColor: activeTab === "all" ? "var(--ink, #0f172a)" : "var(--rule, #e2e8f0)"
              }}
              onClick={() => setActiveTab("all")}
            >
              All Accounts ({bankAccounts.length})
            </button>
            <button
              className="btn"
              style={{
                fontSize: 12, padding: "4px 10px",
                background: activeTab === "cash" ? "#D97706" : "transparent",
                color: activeTab === "cash" ? "#fff" : "var(--ink, #0f172a)",
                borderColor: activeTab === "cash" ? "#D97706" : "var(--rule, #e2e8f0)"
              }}
              onClick={() => setActiveTab("cash")}
            >
              💵 Petty Cash ({pettyCashList.length})
            </button>
            <button
              className="btn"
              style={{
                fontSize: 12, padding: "4px 10px",
                background: activeTab === "bank" ? "#0284C7" : "transparent",
                color: activeTab === "bank" ? "#fff" : "var(--ink, #0f172a)",
                borderColor: activeTab === "bank" ? "#0284C7" : "var(--rule, #e2e8f0)"
              }}
              onClick={() => setActiveTab("bank")}
            >
              🏦 Bank Accounts ({bankList.length})
            </button>
          </div>

          <button
            className="btn"
            style={{ fontSize: 12, padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: 5, color: "#D97706", borderColor: "#D97706" }}
            onClick={() => setShowNewVaultInline(!showNewVaultInline)}
          >
            <Plus size={13} /> Add Petty Cash Vault
          </button>
        </div>

        {/* Inline Add New Vault Form */}
        {showNewVaultInline && (
          <div style={{
            padding: "14px 20px",
            background: "rgba(217, 119, 6, 0.08)",
            borderBottom: "1px solid rgba(217, 119, 6, 0.2)",
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 1fr auto",
            gap: 10,
            alignItems: "flex-end"
          }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-muted)", display: "block", marginBottom: 4 }}>Vault / Office Name *</label>
              <input
                type="text"
                className="input"
                style={{ padding: "6px 10px", fontSize: 12.5 }}
                placeholder="e.g. Petty Cash - Site Office"
                value={newVaultName}
                onChange={e => setNewVaultName(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-muted)", display: "block", marginBottom: 4 }}>Branch / Location</label>
              <input
                type="text"
                className="input"
                style={{ padding: "6px 10px", fontSize: 12.5 }}
                placeholder="e.g. DHA Phase 6"
                value={newVaultLocation}
                onChange={e => setNewVaultLocation(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-muted)", display: "block", marginBottom: 4 }}>Opening Balance (PKR)</label>
              <input
                type="number"
                className="input mono"
                style={{ padding: "6px 10px", fontSize: 12.5, fontWeight: 700 }}
                placeholder="0"
                value={newVaultBalance}
                onChange={e => setNewVaultBalance(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="btn btn-primary"
                style={{ padding: "6px 12px", fontSize: 12, background: "#D97706", borderColor: "#D97706" }}
                onClick={handleCreateVault}
                disabled={!newVaultName.trim()}
              >
                Create
              </button>
              <button
                className="btn"
                style={{ padding: "6px 8px", fontSize: 12 }}
                onClick={() => setShowNewVaultInline(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Accounts List for Opening Balance editing */}
        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredAccounts.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, color: "var(--ink-muted)" }}>
              No accounts found in this category. Click <b>"Add Petty Cash Vault"</b> or <b>"Add Bank Account"</b> to register one.
            </div>
          ) : (
            filteredAccounts.map(account => {
              const isCash = account.accountType === "Petty Cash" || account.id.startsWith("bank-cash");
              const currentVal = balances[account.id] !== undefined ? balances[account.id] : "";

              return (
                <div
                  key={account.id}
                  style={{
                    border: `1px solid ${isCash ? "rgba(217, 119, 6, 0.3)" : "var(--rule, #e2e8f0)"}`,
                    borderRadius: 8,
                    padding: "12px 16px",
                    display: "grid",
                    gridTemplateColumns: "1.5fr 1fr",
                    gap: 16,
                    alignItems: "center",
                    background: isCash ? "rgba(217, 119, 6, 0.02)" : "var(--panel-bg, #ffffff)",
                    borderLeft: `4px solid ${account.color || (isCash ? "#D97706" : "#0284C7")}`
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 14 }}>{isCash ? "💵" : "🏦"}</span>
                      <strong style={{ fontSize: 13.5, color: "var(--ink, #0f172a)" }}>{account.bankName}</strong>
                      <span className="badge-mini" style={{ fontSize: 10.5, background: isCash ? "#FEF3C7" : "#E0F2FE", color: isCash ? "#92400E" : "#0369A1" }}>
                        {account.accountType}
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-muted, #64748b)" }}>
                      {account.accountTitle} • <span className="mono">{account.accountNumber}</span> {account.branch ? `(${account.branch})` : ""}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-muted, #64748b)", display: "block", marginBottom: 4 }}>
                      Opening Balance (PKR):
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="number"
                        className="input mono"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--ink, #0f172a)",
                          borderRadius: 6,
                          borderColor: isCash ? "#D97706" : "var(--rule, #e2e8f0)"
                        }}
                        placeholder="0"
                        value={currentVal}
                        onChange={e => handleBalanceChange(account.id, e.target.value)}
                      />
                      {Number(currentVal) > 0 && (
                        <div style={{ fontSize: 11, color: "#059669", marginTop: 2, textAlign: "right", fontWeight: 600 }}>
                          {fmtPkr(currentVal)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Actions */}
        <div style={{
          padding: "14px 20px",
          borderTop: "1px solid var(--rule, #e2e8f0)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg, #f8fafc)"
        }}>
          <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>
            Total Starting Equity Impact: <b className="mono" style={{ color: "var(--ink)" }}>{fmtPkr(grandTotalOpening)}</b>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" onClick={onClose} style={{ padding: "7px 14px", fontSize: 13 }}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveAll}
              style={{ padding: "7px 18px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, background: "#059669", borderColor: "#059669" }}
            >
              <Check size={14} /> Save Opening Balances
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
