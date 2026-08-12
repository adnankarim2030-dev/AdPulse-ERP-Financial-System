import React, { useState, useEffect } from "react";
import { X, AlertTriangle, Building2, ShieldCheck } from "lucide-react";

export default function ClientMasterModal({ client, clients, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    city: "Karachi",
    ntn: "",
    strn: "",
    paymentTerms: "Net 30",
    creditLimit: 1000000,
    openingBalance: 0,
    status: "Active",
    notes: ""
  });

  const [possibleDuplicate, setPossibleDuplicate] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        companyName: client.companyName || "",
        contactPerson: client.contactPerson || "",
        phone: client.phone || "",
        email: client.email || "",
        address: client.address || "",
        city: client.city || "Karachi",
        ntn: client.ntn || "",
        strn: client.strn || "",
        paymentTerms: client.paymentTerms || "Net 30",
        creditLimit: client.creditLimit || 0,
        openingBalance: client.openingBalance || 0,
        status: client.status || "Active",
        notes: client.notes || ""
      });
    }
  }, [client]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMsg("");
  };

  const checkForDuplicates = () => {
    if (client) return null;
    const compMatch = formData.companyName && clients.find(c => c.companyName?.toLowerCase() === formData.companyName.toLowerCase().trim());
    const nameMatch = formData.name && clients.find(c => c.name?.toLowerCase() === formData.name.toLowerCase().trim());
    const phoneMatch = formData.phone && clients.find(c => c.phone && c.phone.trim() === formData.phone.trim());
    const emailMatch = formData.email && clients.find(c => c.email?.toLowerCase() === formData.email.toLowerCase().trim());
    const ntnMatch = formData.ntn && clients.find(c => c.ntn && c.ntn.trim() === formData.ntn.trim());

    return compMatch || nameMatch || phoneMatch || emailMatch || ntnMatch || null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg("Client Name is required.");
      return;
    }

    const dup = checkForDuplicates();
    if (dup && !possibleDuplicate) {
      setPossibleDuplicate(dup);
      return;
    }

    onSave({
      ...formData,
      creditLimit: Number(formData.creditLimit) || 0,
      openingBalance: Number(formData.openingBalance) || 0
    });
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: 680, borderRadius: 12 }}>
        <div className="modal-header" style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "rgba(2, 132, 199, 0.1)", color: "#0284C7", padding: 8, borderRadius: 8 }}>
              <Building2 size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18 }}>{client ? "Edit Client Master" : "Register New Client Master"}</h3>
              <p style={{ margin: 0, fontSize: 12, color: "var(--ink-muted)" }}>Permanent Client Record &amp; Accounting Sub-Ledger Entity</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}><X size={18} /></button>
        </div>

        {possibleDuplicate && (
          <div style={{ background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 8, padding: 14, margin: "14px 0", color: "#991B1B" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
              <AlertTriangle size={18} color="#DC2626" />
              Possible Existing Client Found!
            </div>
            <p style={{ fontSize: 12.5, margin: "0 0 10px 0" }}>
              A client record with matching details already exists in the system. Please review before proceeding.
            </p>
            <div style={{ background: "#FFFFFF", padding: 10, borderRadius: 6, border: "1px solid #FECACA", fontSize: 12 }}>
              <div><strong>Client ID:</strong> {possibleDuplicate.clientCode || possibleDuplicate.id}</div>
              <div><strong>Client / Company Name:</strong> {possibleDuplicate.companyName || possibleDuplicate.name}</div>
              <div><strong>Contact Person:</strong> {possibleDuplicate.contactPerson || "N/A"} &middot; {possibleDuplicate.phone || "N/A"}</div>
              <div><strong>Email / Tax ID:</strong> {possibleDuplicate.email || "N/A"} | NTN: {possibleDuplicate.ntn || "N/A"}</div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12, justifyContent: "flex-end" }}>
              <button type="button" className="btn" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => setPossibleDuplicate(null)}>Cancel &amp; Edit Details</button>
              <button type="button" className="btn btn-primary" style={{ background: "#DC2626", borderColor: "#DC2626", fontSize: 12, padding: "4px 12px" }} onClick={() => onSave(formData)}>Confirm &amp; Create Record Anyway</button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div style={{ background: "#FEF2F2", color: "#991B1B", padding: "8px 12px", borderRadius: 6, fontSize: 12, marginTop: 10 }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="form-label">Client Name *</label>
              <input type="text" className="form-input" placeholder="e.g. Imtiaz Retail" value={formData.name} onChange={e => handleChange("name", e.target.value)} required />
            </div>

            <div>
              <label className="form-label">Company Name / Registered Title</label>
              <input type="text" className="form-input" placeholder="e.g. Imtiaz Super Market Ltd" value={formData.companyName} onChange={e => handleChange("companyName", e.target.value)} />
            </div>

            <div>
              <label className="form-label">Contact Person</label>
              <input type="text" className="form-input" placeholder="Key Account Contact" value={formData.contactPerson} onChange={e => handleChange("contactPerson", e.target.value)} />
            </div>

            <div>
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-input" placeholder="0300-XXXXXXX" value={formData.phone} onChange={e => handleChange("phone", e.target.value)} />
            </div>

            <div>
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="billing@client.com" value={formData.email} onChange={e => handleChange("email", e.target.value)} />
            </div>

            <div>
              <label className="form-label">City</label>
              <input type="text" className="form-input" placeholder="Karachi" value={formData.city} onChange={e => handleChange("city", e.target.value)} />
            </div>

            <div>
              <label className="form-label">NTN / Tax ID</label>
              <input type="text" className="form-input" placeholder="e.g. 1234567-8" value={formData.ntn} onChange={e => handleChange("ntn", e.target.value)} />
            </div>

            <div>
              <label className="form-label">STRN (Sales Tax Reg No)</label>
              <input type="text" className="form-input" placeholder="e.g. 3277876543210" value={formData.strn} onChange={e => handleChange("strn", e.target.value)} />
            </div>

            <div>
              <label className="form-label">Payment Terms</label>
              <select className="form-select" value={formData.paymentTerms} onChange={e => handleChange("paymentTerms", e.target.value)}>
                <option value="Immediate">Immediate Cash/Advance</option>
                <option value="Net 7">Net 7 Days</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 60">Net 60 Days</option>
              </select>
            </div>

            <div>
              <label className="form-label">Credit Limit (PKR)</label>
              <input type="number" className="form-input" value={formData.creditLimit} onChange={e => handleChange("creditLimit", e.target.value)} min="0" step="50000" />
            </div>

            <div>
              <label className="form-label">Opening Balance (PKR)</label>
              <input type="number" className="form-input" value={formData.openingBalance} onChange={e => handleChange("openingBalance", e.target.value)} disabled={Boolean(client)} placeholder="0.00" />
            </div>

            <div>
              <label className="form-label">Client Status</label>
              <select className="form-select" value={formData.status} onChange={e => handleChange("status", e.target.value)}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Blocked">Blocked / On Hold</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="form-label">Address</label>
            <input type="text" className="form-input" placeholder="Full street address" value={formData.address} onChange={e => handleChange("address", e.target.value)} />
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="form-label">Notes &amp; Internal Observations</label>
            <textarea className="form-input" style={{ height: 60 }} placeholder="Additional client preferences or history..." value={formData.notes} onChange={e => handleChange("notes", e.target.value)} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18, borderTop: "1px solid var(--rule)", paddingTop: 12 }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ShieldCheck size={16} /> Save Client Master
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
