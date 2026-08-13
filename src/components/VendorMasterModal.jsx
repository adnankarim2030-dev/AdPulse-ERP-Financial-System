import React, { useState, useEffect } from "react";
import { X, AlertTriangle, Truck, ShieldCheck, Landmark, MapPin, CreditCard, UserCheck } from "lucide-react";

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
    if (vendor || !vendors) return null;
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
    <div className="modal-backdrop" style={{ zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)" }}>
      <div className="modal" style={{ width: 760, maxWidth: "94vw", maxHeight: "90vh", overflowY: "auto", padding: 0, borderRadius: 16, background: "#FFFFFF", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)", border: "1px solid #E2E8F0" }}>
        
        {/* MODAL HEADER */}
        <div style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #D97706, #B45309)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(217, 119, 6, 0.35)" }}>
              <Truck size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                {vendor ? "Edit Vendor Master" : "Register New Vendor Master"}
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#94A3B8" }}>
                Supplier Profile &amp; Accounts Payable Sub-Ledger Entity
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#94A3B8", width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#FFFFFF"; e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          {/* DUPLICATE DETECTION ALERT */}
          {possibleDuplicate && (
            <div style={{ background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 12, padding: 16, marginBottom: 20, color: "#991B1B" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 14.5, marginBottom: 8 }}>
                <AlertTriangle size={20} color="#DC2626" />
                Matching Vendor Entity Found in Database!
              </div>
              <p style={{ fontSize: 13, margin: "0 0 12px 0", color: "#7F1D1D", lineHeight: 1.4 }}>
                A vendor record with matching company name or tax registration already exists.
              </p>
              <div style={{ background: "#FFFFFF", padding: 12, borderRadius: 8, border: "1px solid #FECACA", fontSize: 12.5, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <div><strong>Vendor Code:</strong> {possibleDuplicate.vendorCode || possibleDuplicate.id}</div>
                <div><strong>Company Title:</strong> {possibleDuplicate.companyName || possibleDuplicate.name}</div>
                <div><strong>Contact:</strong> {possibleDuplicate.contactPerson || "N/A"} ({possibleDuplicate.phone || "N/A"})</div>
                <div><strong>NTN / STRN:</strong> {possibleDuplicate.ntn || "N/A"}</div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
                <button type="button" className="btn" style={{ fontSize: 12.5, padding: "6px 14px" }} onClick={() => setPossibleDuplicate(null)}>Cancel &amp; Edit Details</button>
                <button type="button" className="btn btn-primary" style={{ background: "#DC2626", borderColor: "#DC2626", fontSize: 12.5, padding: "6px 14px" }} onClick={() => onSave(formData)}>Confirm &amp; Create Record</button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={16} /> {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* SECTION 1: PRIMARY PROFILE */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#D97706", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <UserCheck size={15} /> 1. Vendor Profile &amp; Basic Info
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="field">
                  <label className="field-label" style={{ fontWeight: 700, fontSize: 12.5, color: "#334155" }}>Vendor Name *</label>
                  <input type="text" className="input" placeholder="e.g. ABC Printing" value={formData.name} onChange={e => handleChange("name", e.target.value)} required style={{ padding: "9px 12px", fontSize: 13, borderRadius: 8 }} />
                </div>

                <div className="field">
                  <label className="field-label" style={{ fontWeight: 700, fontSize: 12.5, color: "#334155" }}>Company Registered Title</label>
                  <input type="text" className="input" placeholder="e.g. ABC Printing Solutions Pvt Ltd" value={formData.companyName} onChange={e => handleChange("companyName", e.target.value)} style={{ padding: "9px 12px", fontSize: 13, borderRadius: 8 }} />
                </div>

                <div className="field">
                  <label className="field-label" style={{ fontWeight: 700, fontSize: 12.5, color: "#334155" }}>Contact Person</label>
                  <input type="text" className="input" placeholder="Vendor Account Manager" value={formData.contactPerson} onChange={e => handleChange("contactPerson", e.target.value)} style={{ padding: "9px 12px", fontSize: 13, borderRadius: 8 }} />
                </div>

                <div className="field">
                  <label className="field-label" style={{ fontWeight: 700, fontSize: 12.5, color: "#334155" }}>Phone Number</label>
                  <input type="text" className="input" placeholder="0322-XXXXXXX" value={formData.phone} onChange={e => handleChange("phone", e.target.value)} style={{ padding: "9px 12px", fontSize: 13, borderRadius: 8 }} />
                </div>

                <div className="field">
                  <label className="field-label" style={{ fontWeight: 700, fontSize: 12.5, color: "#334155" }}>Email Address</label>
                  <input type="email" className="input" placeholder="orders@vendor.com" value={formData.email} onChange={e => handleChange("email", e.target.value)} style={{ padding: "9px 12px", fontSize: 13, borderRadius: 8 }} />
                </div>

                <div className="field">
                  <label className="field-label" style={{ fontWeight: 700, fontSize: 12.5, color: "#334155" }}>City / Region</label>
                  <input type="text" className="input" placeholder="Karachi" value={formData.city} onChange={e => handleChange("city", e.target.value)} style={{ padding: "9px 12px", fontSize: 13, borderRadius: 8 }} />
                </div>
              </div>
            </div>

            {/* SECTION 2: TAXATION & PAYMENT TERMS */}
            <div style={{ marginBottom: 20, paddingTop: 16, borderTop: "1px dashed #E2E8F0" }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#0284C7", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <CreditCard size={15} /> 2. Tax Registrations &amp; Credit Terms
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="field">
                  <label className="field-label" style={{ fontWeight: 700, fontSize: 12.5, color: "#334155" }}>NTN / Income Tax ID</label>
                  <input type="text" className="input" placeholder="e.g. 9876543-2" value={formData.ntn} onChange={e => handleChange("ntn", e.target.value)} style={{ padding: "9px 12px", fontSize: 13, borderRadius: 8 }} />
                </div>

                <div className="field">
                  <label className="field-label" style={{ fontWeight: 700, fontSize: 12.5, color: "#334155" }}>STRN (Sales Tax Reg No)</label>
                  <input type="text" className="input" placeholder="e.g. 1122334455667" value={formData.strn} onChange={e => handleChange("strn", e.target.value)} style={{ padding: "9px 12px", fontSize: 13, borderRadius: 8 }} />
                </div>

                <div className="field">
                  <label className="field-label" style={{ fontWeight: 700, fontSize: 12.5, color: "#334155" }}>Payment Terms</label>
                  <select className="select" value={formData.paymentTerms} onChange={e => handleChange("paymentTerms", e.target.value)} style={{ padding: "9px 12px", fontSize: 13, borderRadius: 8 }}>
                    <option value="Immediate">Immediate Cash</option>
                    <option value="Net 7">Net 7 Days</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                  </select>
                </div>

                <div className="field">
                  <label className="field-label" style={{ fontWeight: 700, fontSize: 12.5, color: "#334155" }}>Opening Payable Balance (PKR)</label>
                  <input type="number" className="input" value={formData.openingBalance} onChange={e => handleChange("openingBalance", e.target.value)} disabled={Boolean(vendor)} placeholder="0.00" style={{ padding: "9px 12px", fontSize: 13, borderRadius: 8 }} />
                </div>

                <div className="field" style={{ gridColumn: "span 2" }}>
                  <label className="field-label" style={{ fontWeight: 700, fontSize: 12.5, color: "#334155" }}>Vendor Status</label>
                  <select className="select" value={formData.status} onChange={e => handleChange("status", e.target.value)} style={{ padding: "9px 12px", fontSize: 13, borderRadius: 8 }}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Blocked">Blocked / Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3: BANK DETAILS */}
            <div style={{ marginBottom: 20, paddingTop: 16, borderTop: "1px dashed #E2E8F0" }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#059669", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Landmark size={15} /> 3. Banking Details (For Wire Transfer Payments)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div className="field">
                  <label className="field-label" style={{ fontWeight: 700, fontSize: 12.5, color: "#334155" }}>Bank Name</label>
                  <input type="text" className="input" placeholder="e.g. Meezan Bank" value={formData.bankName} onChange={e => handleChange("bankName", e.target.value)} style={{ padding: "9px 12px", fontSize: 13, borderRadius: 8 }} />
                </div>

                <div className="field">
                  <label className="field-label" style={{ fontWeight: 700, fontSize: 12.5, color: "#334155" }}>Account Title</label>
                  <input type="text" className="input" placeholder="Title on Account" value={formData.bankAccountTitle} onChange={e => handleChange("bankAccountTitle", e.target.value)} style={{ padding: "9px 12px", fontSize: 13, borderRadius: 8 }} />
                </div>

                <div className="field">
                  <label className="field-label" style={{ fontWeight: 700, fontSize: 12.5, color: "#334155" }}>Account No / IBAN</label>
                  <input type="text" className="input" placeholder="PKXX..." value={formData.accountNumberIban} onChange={e => handleChange("accountNumberIban", e.target.value)} style={{ padding: "9px 12px", fontSize: 13, borderRadius: 8 }} />
                </div>
              </div>
            </div>

            {/* SECTION 4: LOCATION & NOTES */}
            <div style={{ paddingTop: 16, borderTop: "1px dashed #E2E8F0" }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748B", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={15} /> 4. Address &amp; Contract Terms
              </div>
              <div className="field" style={{ marginBottom: 14 }}>
                <label className="field-label" style={{ fontWeight: 700, fontSize: 12.5, color: "#334155" }}>Vendor Address</label>
                <input type="text" className="input" placeholder="Full office or factory address" value={formData.address} onChange={e => handleChange("address", e.target.value)} style={{ padding: "9px 12px", fontSize: 13, borderRadius: 8 }} />
              </div>

              <div className="field">
                <label className="field-label" style={{ fontWeight: 700, fontSize: 12.5, color: "#334155" }}>Notes &amp; Observations</label>
                <textarea className="input" style={{ height: 60, padding: "9px 12px", fontSize: 13, borderRadius: 8, resize: "vertical" }} placeholder="Notes on vendor rates, lead times, or service scope..." value={formData.notes} onChange={e => handleChange("notes", e.target.value)} />
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid #E2E8F0" }}>
              <button type="button" className="btn" onClick={onClose} style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600 }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ padding: "10px 24px", fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg, #D97706, #B45309)", border: "none", boxShadow: "0 4px 12px rgba(217, 119, 6, 0.3)", display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={16} /> {vendor ? "Update Vendor Master" : "Save Vendor Master Entity"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
