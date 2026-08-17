import React, { useState, useMemo } from "react";
import { Search, X, Building2, Truck, FolderKanban, FileText, Receipt, ArrowRight } from "lucide-react";
import { cleanInvoiceNo } from "../App.jsx";

export default function GlobalSearchBar({
  clients = [],
  vendors = [],
  projects = [],
  invoices = [],
  expenses = [],
  vouchers = [],
  documents = [],
  onNavigate
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const searchResults = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase().trim();
    const results = [];

    // Search Clients
    clients.forEach(c => {
      if ((c.name && c.name.toLowerCase().includes(q)) ||
          (c.companyName && c.companyName.toLowerCase().includes(q)) ||
          (c.clientCode && c.clientCode.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))) {
        results.push({
          type: "Client",
          id: c.id,
          title: c.name,
          subtitle: `Client ID: ${c.clientCode || c.id} • ${c.companyName || c.phone || ""}`,
          tab: "clients",
          raw: c
        });
      }
    });

    // Search Vendors
    vendors.forEach(v => {
      if ((v.name && v.name.toLowerCase().includes(q)) ||
          (v.companyName && v.companyName.toLowerCase().includes(q)) ||
          (v.vendorCode && v.vendorCode.toLowerCase().includes(q)) ||
          (v.phone && v.phone.includes(q))) {
        results.push({
          type: "Vendor",
          id: v.id,
          title: v.name,
          subtitle: `Vendor ID: ${v.vendorCode || v.id} • ${v.companyName || v.phone || ""}`,
          tab: "vendors",
          raw: v
        });
      }
    });

    // Search Projects
    projects.forEach(p => {
      if ((p.name && p.name.toLowerCase().includes(q)) ||
          (p.projectCode && p.projectCode.toLowerCase().includes(q)) ||
          (p.client && p.client.toLowerCase().includes(q))) {
        results.push({
          type: "Project",
          id: p.id,
          title: p.name,
          subtitle: `Project Code: ${p.projectCode || p.id} • Client: ${p.client}`,
          tab: "projects",
          raw: p
        });
      }
    });

    // Search Invoices
    invoices.forEach(i => {
      const invNo = i.invoiceNo || i.id;
      if (invNo.toLowerCase().includes(q) ||
          (i.client && i.client.toLowerCase().includes(q)) ||
          (i.description && i.description.toLowerCase().includes(q))) {
        results.push({
          type: "Invoice",
          id: i.id,
          title: cleanInvoiceNo(invNo),
          subtitle: `Client: ${i.client} • Amount: PKR ${(i.totalAmount || i.amount).toLocaleString()}`,
          tab: "invoices",
          raw: i
        });
      }
    });

    // Search Expenses
    expenses.forEach(e => {
      const expNo = e.expenseNo || e.id;
      if (expNo.toLowerCase().includes(q) ||
          (e.vendor && e.vendor.toLowerCase().includes(q)) ||
          (e.category && e.category.toLowerCase().includes(q))) {
        results.push({
          type: "Expense",
          id: e.id,
          title: `EXP-${expNo}`,
          subtitle: `Vendor: ${e.vendor} • Category: ${e.category} • PKR ${e.amount.toLocaleString()}`,
          tab: "expenses",
          raw: e
        });
      }
    });

    // Search Vouchers
    vouchers.forEach(v => {
      const vNo = v.voucherNo || v.id;
      if (vNo.toLowerCase().includes(q) ||
          (v.party && v.party.toLowerCase().includes(q)) ||
          (v.description && v.description.toLowerCase().includes(q))) {
        results.push({
          type: "Voucher",
          id: v.id,
          title: vNo,
          subtitle: `Type: ${v.type} • Party: ${v.party} • PKR ${v.amount.toLocaleString()}`,
          tab: "vouchers",
          raw: v
        });
      }
    });

    return results.slice(0, 15);
  }, [query, clients, vendors, projects, invoices, expenses, vouchers]);

  const handleSelect = (item) => {
    setIsOpen(false);
    setQuery("");
    if (onNavigate) {
      onNavigate(item.tab, item.raw);
    }
  };

  return (
    <div style={{ position: "relative", width: 340 }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <Search size={16} color="var(--ink-muted)" style={{ position: "absolute", left: 12 }} />
        <input
          type="text"
          className="form-input"
          style={{ paddingLeft: 36, paddingRight: query ? 32 : 12, borderRadius: 20, fontSize: 13, background: "var(--bg)", height: 36 }}
          placeholder="Global Search (Client, Vendor, Project, INV...)"
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setIsOpen(false); }}
            style={{ position: "absolute", right: 10, background: "none", border: "none", cursor: "pointer", color: "var(--ink-muted)", padding: 2 }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* DROPDOWN RESULTS */}
      {isOpen && query.length >= 2 && (
        <div style={{
          position: "absolute", top: 42, left: 0, right: 0, background: "var(--card-bg)",
          borderRadius: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.15)", border: "1px solid var(--rule)",
          zIndex: 2000, maxHeight: 380, overflowY: "auto"
        }}>
          {searchResults.length === 0 ? (
            <div style={{ padding: 16, textAlign: "center", color: "var(--ink-muted)", fontSize: 13 }}>
              No records matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div>
              <div style={{ padding: "8px 12px", background: "var(--bg)", fontSize: 11, fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase" }}>
                Search Results ({searchResults.length})
              </div>
              {searchResults.map((res, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelect(res)}
                  style={{
                    padding: "10px 14px", borderBottom: "1px solid var(--rule)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    transition: "background 0.15s ease"
                  }}
                  className="clickable"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      padding: "3px 8px", borderRadius: 12, fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                      background: res.type === "Client" ? "rgba(2, 132, 199, 0.1)" :
                                  res.type === "Vendor" ? "rgba(217, 119, 6, 0.1)" :
                                  res.type === "Project" ? "rgba(124, 58, 237, 0.1)" : "rgba(5, 150, 105, 0.1)",
                      color: res.type === "Client" ? "#0284C7" :
                             res.type === "Vendor" ? "#D97706" :
                             res.type === "Project" ? "#7C3AED" : "#059669"
                    }}>
                      {res.type}
                    </span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{res.title}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{res.subtitle}</div>
                    </div>
                  </div>
                  <ArrowRight size={14} color="var(--ink-muted)" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
