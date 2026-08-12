import React, { useState, useEffect } from "react";
import { X, AlertTriangle, Truck, ShieldCheck } from "lucide-react";

export default function VendorMasterModal({ vendor, vendors, onClose, onSave }) {
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
    bankName: "",
    bankAccountTitle: "",
    accountNumberIban: "",
    openingBalance: 0,
    status: "Active",
    notes: ""
  });

  const [possibleDuplicate, setPossibleDuplicate] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || "",
        companyName: vendor.companyName || "",
        contactPerson: vendor.contactPerson || "",
        phone: vendor.phone || "",
        email: vendor.email || "",
        address: vendor.address || "",
        city: vendor.city || "Karachi",
        ntn: vendor.ntn || "",
        strn: vendor.strn || "",
        paymentTerms: vendor.paymentTerms || "Net 30",
        bankName: vendor.bankName || "",
        bankAccountTitle: vendor.bankAccountTitle || "",
        accountNumberIban: vendor.accountNumberIban || "",
        openingBalance: vendor.openingBalance || 0,
        status: vendor.status || "Active",
        notes: vendor.notes || ""
      });
    }
  }, [vendor]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMsg("");
  };

  const checkForDuplicates = () => {
    if (vendor) return null;
    const compMatch = formData.companyName && vendors.find(v => v.companyName?.toLowerCase() === formData.companyName.toLowerCase().trim());
    const nameMatch = formData.name && vendors.find(v => v.name?.toLowerCase() === formData.name.toLowerCase().trim());
    const phoneMatch = formData.phone && vendors.find(v => v.phone && v.phone.trim() === formData.phone.trim());
    const emailMatch = formData.email && vendors.find(v => v.email?.toLowerCase() === formData.email.toLowerCase().trim());
    const ntnMatch = formData.ntn && vendors.find(v => v.ntn && v.ntn.trim() === formData.ntn.trim());

    return compMatch || nameMatch || phoneMatch || emailMatch || ntnMatch || null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg("Vendor Name is required.");
      return;
    }

    const dup = checkForDuplicates();
    if (dup && !possibleDuplicate) {
      setPossibleDuplicate(dup);
      return;
    }

    onSave({
      ...formData,
      openingBalance: Number(formData.openingBalance) || 0
    });
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: 680, borderRadius: 12 }}>
        <div className="modal-header" style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "rgba(217, 119, 6, 0.1)", color: "#D97706", padding: 8, borderRadius: 8 }}>
              <Truck size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18 }}>{vendor ? "Edit Vendor Master" : "Register New Vendor Master"}</h3>
              <p style={{ margin: 0, fontSize: 12, color: "var(--ink-muted)" }}>Supplier Record &amp; Accounts Payable Sub-Ledger Entity</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}><X size={18} /></button>
        </div>

        {possibleDuplicate && (
          <div style={{ background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 8, padding: 14, margin: "14px 0", color: "#991B1B" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
              <AlertTriangle size={18} color="#DC2626" />
              Possible Existing Vendor Found!
            </div>
            <p style={{ fontSize: 12.5, margin: "0 0 10px 0" }}>
              A vendor record with matching details already exists in the system. Please review before proceeding.
            </p>
            <div style={{ background: "#FFFFFF", padding: 10, borderRadius: 6, border: "1px solid #FECACA", fontSize: 12 }}>
              <div><strong>Vendor ID:</strong> {possibleDuplicate.vendorCode || possibleDuplicate.id}</div>
              <div><strong>Vendor / Company Name:</strong> {possibleDuplicate.companyName || possibleDuplicate.name}</div>
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
              <label className="form-label">Vendor Name *</label>
              <input type="text" className="form-input" placeholder="e.g. ABC Printing" value={formData.name} onChange={e => handleChange("name", e.target.value)} required />
            </div>

            <div>
              <label className="form-label">Company Name / Registered Title</label>
              <input type="text" className="form-input" placeholder="e.g. ABC Printing Solutions Pvt Ltd" value={formData.companyName} onChange={e => handleChange("companyName", e.target.value)} />
            </div>

            <div>
              <label className="form-label">Contact Person</label>
              <input type="text" className="form-input" placeholder="Vendor Account Manager" value={formData.contactPerson} onChange={e => handleChange("contactPerson", e.target.value)} />
            </div>

            <div>
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-input" placeholder="0322-XXXXXXX" value={formData.phone} onChange={e => handleChange("phone", e.target.value)} />
            </div>

            <div>
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="orders@vendor.com" value={formData.email} onChange={e => handleChange("email", e.target.value)} />
            </div>

            <div>
              <label className="form-label">City</label>
              <input type="text" className="form-input" placeholder="Karachi" value={formData.city} onChange={e => handleChange("city", e.target.value)} />
            </div>

            <div>
              <label className="form-label">NTN / Tax ID</label>
              <input type="text" className="form-input" placeholder="e.g. 9876543-2" value={formData.ntn} onChange={e => handleChange("ntn", e.target.value)} />
            </div>

            <div>
              <label className="form-label">STRN (Sales Tax Reg No)</label>
              <input type="text" className="form-input" placeholder="e.g. 1122334455667" value={formData.strn} onChange={e => handleChange("strn", e.target.value)} />
            </div>

            <div>
              <label className="form-label">Payment Terms</label>
              <select className="form-select" value={formData.paymentTerms} onChange={e => handleChange("paymentTerms", e.target.value)}>
                <option value="Immediate">Immediate Cash</option>
                <option value="Net 7">Net 7 Days</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 60">Net 60 Days</option>
              </select>
            </div>

            <div>
              <label className="form-label">Opening Payable Balance (PKR)</label>
              <input type="number" className="form-input" value={formData.openingBalance} onChange={e => handleChange("openingBalance", e.target.value)} disabled={Boolean(vendor)} placeholder="0.00" />
            </div>

            <div>
              <label className="form-label">Vendor Status</label>
              <select className="form-select" value={formData.status} onChange={e => handleChange("status", e.target.value)}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Blocked">Blocked / Suspended</option>
              </select>
            </div>
          </div>

          <div style={{ borderTop: "1px dashed var(--rule)", paddingTop: 12, marginTop: 12 }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: 13.5, color: "var(--ink-muted)" }}>Vendor Banking Details (For Wire Transfers)</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <label className="form-label">Bank Name</label>
                <input type="text" className="form-input" placeholder="e.g. Meezan Bank" value={formData.bankName} onChange={e => handleChange("bankName", e.target.value)} />
              </div>
              <div>
                <label className="form-label">Bank Account Title</label>
                <input type="text" className="form-input" placeholder="Title on Account" value={formData.bankAccountTitle} onChange={e => handleChange("bankAccountTitle", e.target.value)} />
              </div>
              <div>
                <label className="form-label">Account No / IBAN</label>
                <input type="text" className="form-input" placeholder="PKXX..." value={formData.accountNumberIban} onChange={e => handleChange("accountNumberIban", e.target.value)} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="form-label">Vendor Address</label>
            <input type="text" className="form-input" placeholder="Full office or factory address" value={formData.address} onChange={e => handleChange("address", e.target.value)} />
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="form-label">Notes &amp; Contract Terms</label>
            <textarea className="form-input" style={{ height: 50 }} placeholder="Notes on vendor rates, lead times, or service scope..." value={formData.notes} onChange={e => handleChange("notes", e.target.value)} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18, borderTop: "1px solid var(--rule)", paddingTop: 12 }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, background: "#D97706", borderColor: "#D97706" }}>
              <ShieldCheck size={16} /> Save Vendor Master
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
