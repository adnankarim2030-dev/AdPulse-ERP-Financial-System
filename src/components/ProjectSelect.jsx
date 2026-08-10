import React from "react";

/**
 * ProjectSelect Component
 * Standardized dropdown for selecting projects in transaction forms.
 */
export default function ProjectSelect({ projects = [], value, onChange, required = false }) {
  return (
    <div className="field" style={{ marginBottom: "14px" }}>
      <label style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>
        Project {required && <span style={{ color: "#dc2626" }}>*</span>}
      </label>
      <select
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "9px 12px",
          borderRadius: "8px",
          border: "1px solid #CBD5E1",
          fontSize: "13.5px"
        }}
      >
        <option value="">
          -- Select Project --
        </option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.client})
          </option>
        ))}
      </select>
    </div>
  );
}
