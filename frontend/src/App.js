import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { EmployeeAuthProvider } from "./context/EmployeeAuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedEmployeeRoute from "./components/ProtectedEmployeeRoute";

import PortalSelect from "./pages/PortalSelect";
import CustomerAuth from "./pages/customer/CustomerAuth";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerReturnForm from "./pages/customer/CustomerReturnForm";
import MyReturns from "./pages/customer/MyReturns";

// Employee login (pages/login.js) was upgraded in Phase 2 - it now
// exclusively serves the Employee Portal (the Customer Portal has had
// its own auth page since Phase 1).
import Login from "./pages/login";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeReturns from "./pages/employee/EmployeeReturns";

// ReturnForm.js / ReturnsTable.js are the original, pre-Phase-2 pages.
// Left completely untouched and still reachable at their original
// hardcoded paths, purely as a fallback / for comparison - the real
// Employee Portal now lives at /employee/dashboard and /employee/returns.
import ReturnForm from "./pages/ReturnForm";
import ReturnsTable from "./pages/ReturnsTable";

import "./App.css";

function LegacyProtectedRoute({ children }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  return isLoggedIn ? children : <Navigate to="/employee/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <EmployeeAuthProvider>
        <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Portal selection landing page */}
            <Route path="/" element={<PortalSelect />} />

            {/* ================= Customer Portal ================= */}
            <Route path="/customer/login" element={<CustomerAuth />} />
            <Route path="/customer/signup" element={<CustomerAuth />} />
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/submit-return"
              element={
                <ProtectedRoute>
                  <CustomerReturnForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/my-returns"
              element={
                <ProtectedRoute>
                  <MyReturns />
                </ProtectedRoute>
              }
            />

            {/* ================= Employee Portal (Phase 2) ================= */}
            <Route path="/employee/login" element={<Login />} />
            <Route
              path="/employee/dashboard"
              element={
                <ProtectedEmployeeRoute>
                  <EmployeeDashboard />
                </ProtectedEmployeeRoute>
              }
            />
            <Route
              path="/employee/returns"
              element={
                <ProtectedEmployeeRoute>
                  <EmployeeReturns />
                </ProtectedEmployeeRoute>
              }
            />

            {/* ============ Original pre-Phase-2 pages (untouched, still reachable) ============ */}
            <Route
              path="/return-form"
              element={
                <LegacyProtectedRoute>
                  <ReturnForm />
                </LegacyProtectedRoute>
              }
            />
            <Route
              path="/returns-table"
              element={
                <LegacyProtectedRoute>
                  <ReturnsTable />
                </LegacyProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </ToastProvider>
      </EmployeeAuthProvider>
    </AuthProvider>
  );
}

export default App;
