import { useNavigate } from "react-router-dom";
import ErrorIcon from "@mui/icons-material/Error";
import {
  Box,
  Typography,
  Alert,
  Card,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
} from "@mui/material";

const columns = ["id_cliente", "razon_social", "email", "ciudad", "fecha_alta"];

const rows = [
  ["1001", "Acme S.A.", "contacto@acme.com", "Córdoba", "12/03/2024"],
  ["1002", "Bodega Los Andes", "ventas@losandes.com", "Rosario", "05/07/2024"],
  [
    "1003",
    "Distribuidora Cuyo",
    "info@dcuyo.com",
    "Buenos Aires",
    "19/11/2024",
  ],
  ["1004", "Almacén Central", "sin email", "Salta", "02/01/2025"],
  ["1005", "Vinos del Sur", "hola@vinosdelsur.com", "Neuquén", "30/02/2025"],
];

const cellErrors: Record<number, Record<number, string>> = {
  3: { 2: "Formato de email inválido" },
  4: { 4: "La fecha indicada no existe" },
};

export default function PreviewPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/fuentes/nueva");
  };

  const handleImport = () => {
    navigate("/fuentes");
  };

  return (
    <Box>
      <Typography variant="h4">Vista previa</Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        clientes_2025.xlsx · primeras 5 filas de 120
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        2 registros no se pueden importar: la fila 4 tiene un email inválido y
        la fila 5 una fecha que no existe. El resto se importa igual.
      </Alert>

      <Card
        variant="outlined"
        sx={{
          mb: 3,
          overflowX: "auto",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column} sx={{ fontWeight: 700 }}>
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row, rowIndex) => {
              const rowErrors = cellErrors[rowIndex];
              const hasError = Boolean(rowErrors);

              return (
                <TableRow
                  key={row[0]}
                  sx={{
                    bgcolor: hasError ? "rgba(237,108,2,.10)" : undefined,
                  }}
                >
                  {row.map((cell, cellIndex) => {
                    const error = rowErrors?.[cellIndex];

                    return (
                      <TableCell
                        key={cellIndex}
                        sx={
                          error
                            ? {
                                color: "error.light",
                                bgcolor: "rgba(211,47,47,.12)",
                              }
                            : undefined
                        }
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.75,
                            minWidth: 0,
                          }}
                        >
                          {error && (
                            <ErrorIcon
                              color="error"
                              fontSize="small"
                              aria-hidden="true"
                            />
                          )}
                          <Box>
                            <Typography variant="body2">{cell}</Typography>
                            {error && (
                              <Typography variant="caption" color="error.light">
                                {error}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Box
        sx={{
          display: "flex",
          gap: 1,
        }}
      >
        <Button onClick={handleBack}>Volver</Button>

        <Button variant="contained" onClick={handleImport}>
          Importar 118 registros
        </Button>
      </Box>
    </Box>
  );
}
