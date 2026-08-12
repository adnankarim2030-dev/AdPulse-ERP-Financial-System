import React from "react";
import { AlertTriangle, X, ShieldAlert, FileText, CheckCircle2 } from "lucide-react";

export default function AiDocumentDuplicateModal({ duplicateInfo, onClose, onConfirmPost }) {
  if (!duplicateInfo) return null;

  const { existing, extracted, docName } = duplicateInfo;

  const pkr = (val) => "PKR " + (Number(val) || 0).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="modal-content" style={{ maxWidth: 640, borderRadius: 12, border: "2px solid #DC2626" }}>
        <div className="modal-header" style={{ background: "#FEF2F2", padding: "14px 18px", borderBottom: "1px solid #FCA5A5", borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "#DC2626", color: "#FFFFFF", padding: 8, borderRadius: 8 }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: "#991B1B" }}>POSSIBLE DUPLICATE DOCUMENT DETECTED</h3>
              <p style={{ margin: 0, fontSize: 12, color: "#991B1B" }}>Posting Stopped &mdash; Explicit Authorization Required</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 8, padding: 12, fontSize: 13, color: "#92400E", marginBottom: 16 }}>
            <strong>Warning:</strong> The extracted document details match an existing posted financial transaction. Posting again will result in duplicate accounting entries.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* EXISTING RECORD */}
            <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 8, border: "1.5px solid #CBD5E1" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", marginBottom: 8 }}>Existing Financial Record</div>
              <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Ref / No:</strong> {existing.refNo || existing.invoiceNo || existing.voucherNo || existing.id}</div>
              <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Party:</strong> {existing.client || existing.vendor || existing.party || "N/A"}</div>
              <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Amount:</strong> <span style={{ color: "#0284C7", fontWeight: 800 }}>{pkr(existing.totalAmount || existing.amount)}</span></div>
              <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Date:</strong> {existing.issueDate || existing.date || "N/A"}</div>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 8 }}>Status: <span style={{ fontWeight: 700, color: "#059669" }}>{existing.status || "Posted"}</span></div>
            </div>

            {/* NEW UPLOADED DOC */}
            <div style={{ background: "#FEF2F2", padding: 14, borderRadius: 8, border: "1.5px solid #FCA5A5" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#991B1B", textTransform: "uppercase", marginBottom: 8 }}>New Uploaded Document</div>
              <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Filename:</strong> {docName || "Uploaded File"}</div>
              <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Ref No:</strong> {extracted.refNo || "N/A"}</div>
              <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Extracted Party:</strong> {extracted.vendor || extracted.client || "N/A"}</div>
              <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Extracted Amount:</strong> <span style={{ color: "#DC2626", fontWeight: 800 }}>{pkr(extracted.amount)}</span></div>
              <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Extracted Date:</strong> {extracted.date || "N/A"}</div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20, borderTop: "1px solid var(--rule)", paddingTop: 14 }}>
            <button className="btn" onClick={onClose} style={{ fontWeight: 600 }}>
              Cancel &amp; Reject Duplicate
            </button>
            <button className="btn btn-primary" onClick={onConfirmPost} style={{ background: "#DC2626", borderColor: "#DC2626", fontWeight: 700 }}>
              Override &amp; Post Duplicate Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
