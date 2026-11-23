import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { Provider } from "./context";
import App from "./App";
import "./styles.css";
const client = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 15000, refetchOnWindowFocus: false },
  },
});
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <Provider>
          <MotionConfig reducedMotion="user">
            <App />
          </MotionConfig>
        </Provider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
