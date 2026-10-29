import { useState, type ChangeEvent, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  Button,
  TextField,
} from "@mui/material";

import TableChartIcon from "@mui/icons-material/TableChart";
import StorageIcon from "@mui/icons-material/Storage";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
import CloudIcon from "@mui/icons-material/Cloud";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import BarChartIcon from "@mui/icons-material/BarChart";
import UploadFileIcon from "@mui/icons-material/UploadFile";

const sourceTypes = [
  {
    name: "Excel / CSV",
    icon: <TableChartIcon />,
  },
  {
    name: "Base SQL",
    icon: <StorageIcon />,
  },
  {
    name: "Trello",
    icon: <ViewKanbanIcon />,
  },
  {
    name: "API externa",
    icon: <CloudIcon />,
  },
  {
    name: "ERP",
    icon: <BusinessIcon />,
  },
  {
    name: "CRM",
    icon: <PeopleIcon />,
  },
  {
    name: "Power BI",
    icon: <BarChartIcon />,
  },
];

export default function AddSourcePage() {
  const [selectedType, setSelectedType] = useState("Excel / CSV");
  const [file, setFile] = useState<File | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const navigate = useNavigate();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
  };

  const handleFileDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && /\.(xlsx|csv)$/i.test(droppedFile.name)) {
      setFile(droppedFile);
    }
  };

  const handleCancel = () => {
    navigate("/fuentes");
  };

  const handleContinue = () => {
    navigate("/fuentes/vista-previa");
  };

  return (
    <Box sx={{ maxWidth: 820 }}>
      <Typography variant="h4">Agregar fuente</Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Elegí de dónde vienen los datos.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 2,
          mb: 4,
        }}
      >
        {sourceTypes.map((sourceType) => {
          const isSelected = selectedType === sourceType.name;

          return (
            <Card
              key={sourceType.name}
              variant="outlined"
              sx={{
                borderColor: isSelected ? "primary.main" : undefined,
                bgcolor: isSelected ? "rgba(109,74,255,.07)" : undefined,
              }}
            >
              <CardActionArea
                onClick={() => setSelectedType(sourceType.name)}
                sx={{
                  p: 2,
                  textAlign: "center",
                }}
              >
                <Box sx={{ color: "primary.main" }}>{sourceType.icon}</Box>

                <Typography sx={{ fontWeight: 600 }}>
                  {sourceType.name}
                </Typography>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>

      <Card variant="outlined" sx={{ p: 3 }}>
        {selectedType === "Excel / CSV" ? (
          <Button
            component="label"
            fullWidth
            onDragOver={(event) => {
              event.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragLeave={() => setIsDraggingFile(false)}
            onDrop={handleFileDrop}
            sx={{
              border: "2px dashed",
              borderColor: isDraggingFile
                ? "primary.light"
                : "rgba(232,231,245,.36)",
              bgcolor: isDraggingFile ? "rgba(139,108,255,.12)" : "transparent",
              py: 6,
              flexDirection: "column",
              gap: 1,
              transition: "background-color .2s, border-color .2s",
            }}
          >
            <UploadFileIcon fontSize="large" />

            <Typography sx={{ fontWeight: 600 }}>
              {file?.name ||
                "Arrastrá un archivo acá o hacé clic para buscarlo"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Formatos admitidos: .xlsx y .csv
            </Typography>

            <input
              hidden
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileChange}
            />
          </Button>
        ) : (
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField label="Nombre de la fuente" />

            <TextField
              label={
                selectedType === "Base SQL" ? "Servidor y base de datos" : "URL"
              }
            />

            <TextField
              label={selectedType === "Base SQL" ? "Usuario" : "API key"}
            />
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
            mt: 3,
          }}
        >
          <Button onClick={handleCancel}>Cancelar</Button>

          <Button
            variant="contained"
            disabled={selectedType === "Excel / CSV" && !file}
            onClick={handleContinue}
          >
            Continuar
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
