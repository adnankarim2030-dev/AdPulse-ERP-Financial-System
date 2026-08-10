import { createContext, useContext, useState, useEffect, useCallback } from "react";

/**
 * ProjectContext
 * Central source of truth for Projects across modular form components.
 */

const ProjectContext = createContext(null);
const STORAGE_KEY = "adpulse_projects";

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setProjects(raw ? JSON.parse(raw) : []);
    } catch (err) {
      console.error("Failed to load projects", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
  }, [projects, loading]);

  const addProject = useCallback((project) => {
    if (!project?.name) {
      throw new Error("Project must have a name");
    }
    const newProject = {
      id: project.id || `PRJ-${Date.now()}`,
      name: project.name,
      client: project.client || "",
      costCenter: project.costCenter || "",
      budget: project.budget || 0,
      status: project.status || "Active",
    };
    setProjects((prev) => [...prev, newProject]);
    return newProject;
  }, []);

  const getProjectById = useCallback(
    (id) => projects.find((p) => p.id === id) || null,
    [projects]
  );

  const value = {
    projects,
    loading,
    hasProjects: projects.length > 0,
    addProject,
    getProjectById,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useProjects must be used inside a <ProjectProvider>");
  }
  return ctx;
}
