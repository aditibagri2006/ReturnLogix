import { createContext, useContext, useState } from "react";

// Kept fully separate from the customer AuthContext so the two portals
// never share identity state. "Remember me" controls whether we persist
// to localStorage (survives browser restarts) or sessionStorage (cleared
// when the tab closes).
const STORAGE_KEY = "employeeAuth";

const EmployeeAuthContext = createContext(null);

function readStoredEmployee() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function EmployeeAuthProvider({ children }) {
  const [employee, setEmployee] = useState(readStoredEmployee);

  const login = (data, remember = true) => {
    const payload = { ...data, role: "employee" };
    const store = remember ? localStorage : sessionStorage;
    store.setItem(STORAGE_KEY, JSON.stringify(payload));
    setEmployee(payload);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    // Keep in sync with the legacy flag used by the old /return-form
    // and /returns-table pages, which are still reachable directly.
    localStorage.removeItem("isLoggedIn");
    setEmployee(null);
  };

  return (
    <EmployeeAuthContext.Provider value={{ employee, login, logout, isAuthenticated: !!employee }}>
      {children}
    </EmployeeAuthContext.Provider>
  );
}

export function useEmployeeAuth() {
  const ctx = useContext(EmployeeAuthContext);
  if (!ctx) {
    throw new Error("useEmployeeAuth must be used within an EmployeeAuthProvider");
  }
  return ctx;
}
