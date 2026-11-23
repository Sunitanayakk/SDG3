import { createDemoApi, createRealApi } from "@setu/api-contracts";
export const demoMode = import.meta.env.VITE_DEMO_MODE !== "false";
export const api = demoMode
  ? createDemoApi(localStorage)
  : createRealApi({
      baseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
      tokenStorage: sessionStorage,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    });
