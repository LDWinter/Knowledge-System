import { createTheme } from "@mui/material";

const COLORS = ["#8B6CFF", "#2DD4BF", "#FBA94B", "#FF6B6B", "#4DABF7", "#51CF66", "#FCC419", "#FF922B", "#9775FA", "#69DB7C"];

// Colores elegidos por el usuario para cada tipo (se guardan en este navegador)
// shortcut: localStorage es por navegador; si hace falta compartirlos entre usuarios, guardarlos en el back
const COLORS_KEY = "knowledge-system:type-colors";
let customColors: Record<string, string> = {};
try {
  customColors = JSON.parse(localStorage.getItem(COLORS_KEY) ?? "{}");
} catch {
  customColors = {};
}

export function setTypeColor(type: string, color: string) {
  customColors = { ...customColors, [type]: color };
  try {
    localStorage.setItem(COLORS_KEY, JSON.stringify(customColors));
  } catch {
    // sin almacenamiento, el color vale solo hasta recargar
  }
}

export function colorForType(type: string): string {
  if (customColors[type]) return customColors[type];
  let hash = 0;
  for (let i = 0; i < type.length; i++) {
    hash = type.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export const theme = createTheme({
    palette: {
        mode: "dark",
        primary: { main: "#8B6CFF" },
        background: {
            default: "#0E0D17",
            paper: "#16152A",
        },
        text: {
            primary: "#E8E7F5",
            secondary: "#9A98B5",
        },
        divider: "rgba(255,255,255,0.08)",
    },

    shape: { borderRadius: 12 },

    typography: {
        fontFamily: '"Segoe UI", system-ui, sans-serif',
        h4: { fontWeight: 700, letterSpacing: -0.5 },
        h6: { fontWeight: 600 },
    },

    components: {
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: { textTransform: "none", fontWeight: 600 },
            },
        },
        // Removes the lighter overlay that MUI adds to paper in dark mode
        MuiPaper: {
            styleOverrides: { root: { backgroundImage: "none" } },
        },
        MuiTableCell: {
            styleOverrides: {
                head: { color: "#9A98B5", fontWeight: 600 },
            },
        },
    },
});