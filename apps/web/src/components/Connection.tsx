import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../services";

export function useConnection() {
  return useQuery({
    queryKey: ["api-connection"],
    enabled: api.mode === "real",
    retry: false,
    staleTime: 15000,
    refetchInterval: 30000,
    queryFn: async () => {
      const result = await fetch(
        (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(
          /\/$/,
          "",
        ) + "/health",
        { signal: AbortSignal.timeout(5000) },
      );
      if (!result.ok) throw new Error("Service unavailable");
      const status = await result.json();
      if (status.mode !== "real") throw new Error("Mode mismatch");
      return status;
    },
  });
}
export function ConnectionNotice() {
  const connection = useConnection();
  if (api.mode === "demo" || !connection.isError) return null;
  return (
    <div className="connection-notice" role="status">
      <div>
        <strong>The AI service is currently unavailable.</strong>
        <p>
          Your access tools and easy-read library still work. Emergency
          information is always available in the menu.
        </p>
      </div>
      <button
        className="button secondary small"
        onClick={() => void connection.refetch()}
      >
        Check again
      </button>
      <Link className="text-link" to="/app/library">
        Read the library
      </Link>
    </div>
  );
}
