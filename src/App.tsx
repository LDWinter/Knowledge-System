import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Alert, Box, Button, CircularProgress } from "@mui/material";

import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import SourcesPage from "./pages/SourcesPage";
import AddSourcePage from "./pages/AddSourcePage";
import PreviewPage from "./pages/PreviewPage";
import GraphPage from "./pages/GraphPage";
import EntityPage from "./pages/EntityPage";
import LoginPage from "./pages/LoginPage";
import { getCurrentUser, login, logout, SESSION_EXPIRED_EVENT } from "./services/api";
import type { User } from "./types";

export default function App() {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const expireSession = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, expireSession);
    getCurrentUser()
      .then((user) => { if (active) setUser(user); })
      .catch((error: unknown) => {
        if (active) setError(error instanceof Error ? error.message : "No se pudo comprobar la sesión.");
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => {
      active = false;
      window.removeEventListener(SESSION_EXPIRED_EVENT, expireSession);
    };
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setUser(await login(email, password));
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  if (isLoading || error) {
    return (
      <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", p: 2 }}>
        {error ? (
          <Alert severity="error" action={<Button color="inherit" onClick={() => window.location.reload()}>Reintentar</Button>}>
            {error}
          </Alert>
        ) : <CircularProgress aria-label="Comprobando sesión" />}
      </Box>
    );
  }

  const from = location.state?.from;
  const returnTo = typeof from === "string" && from.startsWith("/") && !from.startsWith("//") && !from.startsWith("/login") ? from : "/";

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={returnTo} replace /> : <LoginPage onLogin={handleLogin} />} />
      <Route element={user ? <Layout user={user} onLogout={handleLogout} /> : (
        <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
      )}>
        <Route path="/" element={<DashboardPage />} />

        <Route path="/fuentes" element={<SourcesPage />} />
        <Route path="/fuentes/nueva" element={<AddSourcePage />} />
        <Route path="/fuentes/vista-previa" element={<PreviewPage />} />

        <Route path="/grafo" element={<GraphPage />} />
        <Route path="/entidad/:id" element={<EntityPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
