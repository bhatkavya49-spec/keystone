import { useCallback, useMemo, useState } from "react";
import { apiFetch } from "../api/client";
import { AuthContext } from "./authContext";

function readStoredUser() {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  if (token && username && role) {
    return { token, username, role };
  }

  return null;
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const login = useCallback(async (username, password) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: { username, password },
    });

    const nextUser = { token: data.token, username: data.username, role: data.role };

    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    localStorage.setItem("role", data.role);
    setUser(nextUser);

    return nextUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}