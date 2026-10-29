import { useState, type FormEvent } from "react";
import { Alert, Box, Button, Card, TextField, Typography } from "@mui/material";
import HubIcon from "@mui/icons-material/Hub";

type LoginPageProps = {
  onLogin: (email: string, password: string) => Promise<void>;
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await onLogin(email.trim(), password);
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="main" sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", p: 2 }}>
      <Card variant="outlined" sx={{ width: "100%", maxWidth: 400, p: { xs: 3, sm: 4 } }}>
        <HubIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
        <Typography variant="h6" sx={{ mb: 3 }}>Knowledge System</Typography>
        <Typography component="h1" variant="h4" sx={{ mb: 1 }}>Iniciar sesión</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>Ingresá a tu espacio de conocimiento.</Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoFocus
            fullWidth
          />
          <TextField
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth sx={{ mt: 1 }}>
            {isSubmitting ? "Ingresando…" : "Ingresar"}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
