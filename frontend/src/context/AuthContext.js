import { createContext, useContext, useState } from "react";

// NOTE: This is intentionally simple for Phase 1.
// The backend doesn't issue tokens yet (no schema/auth changes this phase),
// so "logged in" just means "we have a verified user record from
// /user/signin sitting in localStorage under its own namespaced key.
// This does NOT touch the old "isLoggedIn" flag used by the legacy
// employee pages - the two systems are fully independent.
const STORAGE_KEY = "customerAuth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = (userData) => {
    const payload = { ...userData, role: "customer" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setUser(payload);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
