import React from "react";

/**
 * RequireProject Component
 * Locks forms if no project exists in the workspace.
 */
export default function RequireProject({ hasProjects = true, action = "do this", children, onAddProject }) {
  if (!hasProjects) {
    return (
      <div className="project-lock-notice" style={styles.wrapper}>
        <div style={styles.icon}>🔒</div>
        <h3 style={styles.title}>No Active Project Found</h3>
        <p style={styles.text}>
          You need to create at least one Project before you can {action}.
        </p>
        <button onClick={onAddProject} style={styles.button}>
          + Create New Project
        </button>
      </div>
    );
  }

  return children;
}

const styles = {
  wrapper: {
    textAlign: "center",
    padding: "36px 20px",
    border: "1px dashed #CBD5E1",
    borderRadius: "12px",
    background: "#F8FAFC",
  },
  icon: { fontSize: "32px", marginBottom: "8px" },
  title: { margin: "0 0 8px", fontSize: "16px", fontWeight: 700 },
  text: { color: "#64748B", marginBottom: "16px", fontSize: "13.5px" },
  button: {
    display: "inline-block",
    padding: "9px 18px",
    background: "#059669",
    color: "#fff",
    borderRadius: "8px",
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
  },
};
