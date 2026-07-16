import { Navigate } from "react-router-dom";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";

function ProtectedEmployeeRoute({ children }) {
  const { isAuthenticated } = useEmployeeAuth();
  return isAuthenticated ? children : <Navigate to="/employee/login" replace />;
}

export default ProtectedEmployeeRoute;
