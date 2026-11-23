import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { PublicLayout, AdminLayout, PatientLayout } from "./layouts";
import { Loading } from "./components/ui";
import {
  AccessibilityPage,
  Chat,
  Emergency,
  FeedbackPage,
  PatientHome,
  Profile,
  Resources,
} from "./pages/Patient";
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const Legal = lazy(() => import("./pages/Legal"));
import {
  AdminSettings,
  Analytics,
  Documents,
  FeedbackAdmin,
  Overview,
  ResourceAdmin,
  Safety,
} from "./pages/Admin";
export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Landing />} />
          <Route path="accessibility" element={<AccessibilityPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="legal/:kind" element={<Legal />} />
        </Route>
        <Route path="signin" element={<Auth />} />
        <Route path="app" element={<PatientLayout />}>
          <Route index element={<PatientHome />} />
          <Route path="chat" element={<Chat />} />
          <Route path="resources" element={<Resources />} />
          <Route path="emergency" element={<Emergency />} />
          <Route path="preferences" element={<AccessibilityPage />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="ai" element={<Chat technical />} />
          <Route path="knowledge" element={<Documents knowledge />} />
          <Route path="documents" element={<Documents />} />
          <Route path="services" element={<ResourceAdmin />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="feedback" element={<FeedbackAdmin />} />
          <Route path="safety" element={<Safety />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route
          path="*"
          element={
            <div className="standalone section-shell">
              <h1>This path hasn’t been built.</h1>
              <Link className="button" to="/">
                Return home
              </Link>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
}
