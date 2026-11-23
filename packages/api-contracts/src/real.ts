import type { Api, Storage, Filters, AuthResult, ChatResponse } from "./types";
export interface RealOptions {
  baseUrl: string;
  tokenStorage: Storage;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}
const TOKEN = "setu-access-token";
export function createRealApi(options: RealOptions): Api {
  const base = options.baseUrl.replace(/\/$/, "");
  async function request<T>(
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<T> {
    const token = await options.tokenStorage.getItem(TOKEN);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000);
    try {
      const form = body instanceof FormData;
      const response = await fetch(base + path, {
        method,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(!form && body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? (form ? body : JSON.stringify(body)) : undefined,
        signal: controller.signal,
      });
      if (!response.ok) {
        let message = `Request failed (${response.status}).`;
        try {
          message = (await response.json()).error?.message || message;
        } catch {}
        throw new Error(message);
      }
      return response.status === 204 ? (undefined as T) : await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError")
        throw new Error(
          "Backend is taking too long. A free service may be waking up; retry in a minute.",
        );
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
  const query = (f: Filters = {}) => {
    const q = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => {
      if (v !== undefined && v !== "") q.set(k, String(v));
    });
    return q.size ? "?" + q.toString() : "";
  };
  const api: Api = {
    mode: "real",
    config: () => request("/api/v1/config/public"),
    async login(email, password) {
      if (!options.supabaseUrl || !options.supabaseAnonKey)
        throw new Error("Supabase public configuration is missing.");
      const response = await fetch(
        options.supabaseUrl + "/auth/v1/token?grant_type=password",
        {
          method: "POST",
          headers: {
            apikey: options.supabaseAnonKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error_description || data.msg || "Sign in failed");
      await options.tokenStorage.setItem(TOKEN, data.access_token);
      return {
        access_token: data.access_token,
        role: "authenticated",
        mode: "real",
      } as AuthResult;
    },
    logout: async () => {
      await options.tokenStorage.removeItem(TOKEN);
    },
    chat: async (req, technical) => {
      const result = await request<ChatResponse>(
        technical ? "/api/v1/admin/ai/test" : "/api/v1/chat",
        "POST",
        req,
      );
      if (result.mode !== "real")
        throw new Error(
          "Configuration mismatch: this backend is in Demo Mode. Set DEMO_MODE=false on the backend or use the explicit demo adapter.",
        );
      return result;
    },
    sessions: () => request("/api/v1/chat/sessions"),
    session: (id) => request("/api/v1/chat/sessions/" + encodeURIComponent(id)),
    deleteSession: (id) =>
      request("/api/v1/chat/sessions/" + encodeURIComponent(id), "DELETE"),
    preferences: () => request("/api/v1/preferences"),
    savePreferences: (p) => request("/api/v1/preferences", "PUT", p),
    resources: () => request("/api/v1/health-resources"),
    saveResource: (r, id) =>
      request(
        "/api/v1/admin/resources" + (id ? "/" + encodeURIComponent(id) : ""),
        id ? "PUT" : "POST",
        r,
      ),
    deleteResource: (id) =>
      request("/api/v1/admin/resources/" + encodeURIComponent(id), "DELETE"),
    feedback: (f) => request("/api/v1/feedback", "POST", f),
    feedbackList: () => request("/api/v1/admin/feedback"),
    overview: () => request("/api/v1/admin/overview"),
    analytics: (f) => request("/api/v1/admin/analytics" + query(f)),
    documents: (f) => request("/api/v1/admin/documents" + query(f)),
    document: (id) =>
      request("/api/v1/admin/documents/" + encodeURIComponent(id)),
    upload: (input) => {
      const form = new FormData();
      form.append("file", input.file, input.filename);
      Object.entries(input).forEach(([k, v]) => {
        if (k !== "file" && k !== "filename") form.append(k, String(v));
      });
      return request("/api/v1/admin/documents", "POST", form);
    },
    index: (id) =>
      request(
        "/api/v1/admin/documents/" + encodeURIComponent(id) + "/index",
        "POST",
      ),
    deleteDocument: (id) =>
      request("/api/v1/admin/documents/" + encodeURIComponent(id), "DELETE"),
    safetyTests: (run) =>
      request(
        "/api/v1/admin/safety-tests" + (run ? "/run" : ""),
        run ? "POST" : "GET",
      ),
    providerHealth: () => request("/api/v1/admin/ai/health", "POST"),
    resetDemo: async () => {
      throw new Error("Demo reset is unavailable in real mode.");
    },
  };
  return api;
}
