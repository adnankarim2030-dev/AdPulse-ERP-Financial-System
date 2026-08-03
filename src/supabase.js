import { createClient } from "@supabase/supabase-js";

const CONFIG_STORAGE_KEY = "adpulse_supabase_client_config";

export function getSupabaseConfig() {
  const envUrl = import.meta.env?.VITE_SUPABASE_URL || "";
  const envKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";

  if (envUrl && envKey) {
    return { url: envUrl, key: envKey, source: "env" };
  }

  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.url && parsed.key) {
        return { url: parsed.url, key: parsed.key, source: "localStorage" };
      }
    }
  } catch (e) {
    console.warn("Could not parse saved Supabase config:", e);
  }

  return { url: "", key: "", source: "none" };
}

export function saveSupabaseConfig(url, key) {
  try {
    if (!url || !key) {
      localStorage.removeItem(CONFIG_STORAGE_KEY);
    } else {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ url: url.trim(), key: key.trim() }));
    }
  } catch (e) {
    console.error("Error saving Supabase config:", e);
  }
}

export function isSupabaseConfigured() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.key);
}

let clientInstance = null;

export function getSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config.url || !config.key) return null;

  if (!clientInstance) {
    try {
      clientInstance = createClient(config.url, config.key);
    } catch (e) {
      console.error("Failed to create Supabase client:", e);
      clientInstance = null;
    }
  }
  return clientInstance;
}

export async function pushStateToSupabase(payload) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase client is not configured.");

  const { data, error } = await supabase
    .from("system_snapshots")
    .upsert({
      id: "latest",
      system_name: payload.system || "AdPulse ERP Financial System",
      version: payload.version || "1.0.0",
      updated_at: new Date().toISOString(),
      updated_by: payload.lastSavedBy || "Admin",
      payload: payload.data || payload
    }, { onConflict: "id" });

  if (error) {
    console.error("Supabase upsert error:", error);
    throw error;
  }
  return data;
}

export async function pullStateFromSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase client is not configured.");

  const { data, error } = await supabase
    .from("system_snapshots")
    .select("payload, updated_at, updated_by")
    .eq("id", "latest")
    .maybeSingle();

  if (error) {
    console.error("Supabase pull error:", error);
    throw error;
  }

  if (!data || !data.payload) {
    return null;
  }

  return {
    data: data.payload,
    updatedAt: data.updated_at,
    updatedBy: data.updated_by
  };
}
