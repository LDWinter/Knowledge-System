import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  CircularProgress,
  Tooltip,
  TextField,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import SyncIcon from "@mui/icons-material/Sync";
import DeleteIcon from "@mui/icons-material/Delete";

import { deleteSource, getSources, synchronizeSource } from "../services/api";
import type { Source } from "../types";

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[] | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const sourceSearch = searchParams.get("buscar") ?? "";

  const navigate = useNavigate();

  useEffect(() => {
    getSources().then(setSources);
  }, []);

  if (!sources) {
    return <CircularProgress />;
  }

  const normalizedSearch = sourceSearch.trim().toLocaleLowerCase("es-AR");
  const filteredSources = sources.filter((source) =>
    `${source.name} ${source.type} ${source.status}`
      .toLocaleLowerCase("es-AR")
      .includes(normalizedSearch),
  );

  const summary = [
    {
      label: "Fuentes conectadas",
      value: sources.length,
    },
    {
      label: "Funcionando",
      value: sources.filter((source) => source.status === "ok").length,
    },
    {
      label: "Con error",
      value: sources.filter((source) => source.status === "error").length,
    },
    {
      label: "Registros importados",
      value: sources.reduce((total, source) => total + source.recordCount, 0),
    },
  ];

  const handleAddSource = () => {
    navigate("/fuentes/nueva");
  };

  const handleSyncSource = async (sourceId: number) => {
    await synchronizeSource(sourceId);
    setSources(await getSources());
  };

  const handleDeleteSource = async (sourceId: number) => {
    await deleteSource(sourceId);
    setSources(await getSources());
  };

  const handleSearchChange = (value: string) => {
    setSearchParams(value ? { buscar: value } : {}, { replace: true });
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4">Fuentes</Typography>

          <Typography color="text.secondary">
            De acá sale toda la información que ves en el grafo.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddSource}
        >
          Agregar fuente
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 3,
        }}
      >
        {summary.map((item) => (
          <Card key={item.label} variant="outlined">
            <CardContent>
              <Typography variant="h4">{item.value}</Typography>

              <Typography variant="body2" color="text.secondary">
                {item.label}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          mb: 1.5,
        }}
      >
        <TextField
          size="small"
          value={sourceSearch}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Filtrar fuentes…"
          slotProps={{ htmlInput: { "aria-label": "Filtrar fuentes" } }}
          sx={{ width: { xs: "100%", sm: 320 } }}
        />
        <Typography variant="caption" color="text.secondary">
          Mostrando {filteredSources.length} de {sources.length} fuentes
        </Typography>
      </Box>

      <Card variant="outlined" sx={{ overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Última sincronización</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredSources.map((source) => (
              <TableRow key={source.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{source.name}</TableCell>

                <TableCell>{source.type}</TableCell>

                <TableCell>
                  <Chip
                    size="small"
                    label={
                      source.status === "ok"
                        ? "Funcionando"
                        : "Error de conexión"
                    }
                    color={source.status === "ok" ? "success" : "error"}
                    variant="outlined"
                  />
                </TableCell>

                <TableCell>{source.lastSync}</TableCell>

                <TableCell align="right">
                  <Tooltip title="Sincronizar">
                    <IconButton onClick={() => handleSyncSource(source.id)}>
                      <SyncIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Eliminar">
                    <IconButton onClick={() => handleDeleteSource(source.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            {filteredSources.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  {sources.length === 0
                    ? "Todavía no hay fuentes. Agregá la primera para empezar."
                    : "No encontré fuentes con ese texto."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </Box>
  );
}
