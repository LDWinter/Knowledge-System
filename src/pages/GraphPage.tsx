import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import {
  Autocomplete,
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import DataObjectIcon from "@mui/icons-material/DataObject";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import JsonViewer from "../components/JsonViewer";
import NodeFormDialog from "../components/NodeFormDialog";
import {
  createEntity,
  createRelationship,
  deleteEntity,
  getEntities,
  getRelationships,
  updateEntity,
} from "../services/api";
import { entityTypeColors } from "../theme";
import type { Entity, EntityInput, EntityType, Relationship } from "../types";

type GraphNode = {
  id: string;
  name: string;
  color: string;
  type: EntityType;
  x?: number;
  y?: number;
};

type GraphLink = {
  source: string;
  target: string;
  sourceType: EntityType;
  targetType: EntityType;
  type: string;
};

type ZoomAction = "in" | "out" | "fit";

type FormState = { mode: "create" } | { mode: "edit"; entity: Entity } | null;

const entityTypes: EntityType[] = ["Cliente", "Producto", "Pedido"];

const ZOOM_FACTOR = 1.4;
const ZOOM_DURATION_MS = 300;

const zoomButtons: { label: string; icon: ReactNode; action: ZoomAction }[] = [
  { label: "Acercar", icon: <AddIcon />, action: "in" },
  { label: "Alejar", icon: <RemoveIcon />, action: "out" },
  {
    label: "Ajustar a la pantalla",
    icon: <CenterFocusStrongIcon />,
    action: "fit",
  },
];

export default function GraphPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [activeTypes, setActiveTypes] = useState<EntityType[]>(entityTypes);
  const [graphWidth, setGraphWidth] = useState(800);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [formState, setFormState] = useState<FormState>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
  const hasInitialFit = useRef(false);
  const navigate = useNavigate();

  // Gráfico más corto en pantallas pequeñas
  const graphHeight = graphWidth < 600 ? 380 : 560;

  const loadData = useCallback(
    () =>
      Promise.all([getEntities(), getRelationships()]).then(
        ([loadedEntities, loadedRelationships]) => {
          setEntities(loadedEntities);
          setRelationships(loadedRelationships);
          setError(null);
        },
      ),
    [],
  );

  useEffect(() => {
    loadData().catch((error: unknown) => {
      setError(error instanceof Error ? error.message : "No se pudo cargar el grafo.");
    });
  }, [loadData]);

  // Mantiene el ancho del gráfico sincronizado con su contenedor
  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setGraphWidth(entry.contentRect.width);
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Los datos del grafo NO dependen de los filtros activos, por lo que los nodos conservan
  // sus posiciones cuando se oculta o se vuelve a mostrar un tipo..
  const graphData = useMemo(() => {
    const entityById = new Map(entities.map((entity) => [entity.id, entity]));

    const nodes: GraphNode[] = entities.map((entity) => ({
      id: entity.id,
      name: entity.name,
      color: entityTypeColors[entity.type],
      type: entity.type,
    }));

    const links: GraphLink[] = [];

    relationships.forEach((relationship) => {
      const sourceEntity = entityById.get(relationship.sourceId);
      const targetEntity = entityById.get(relationship.targetId);

      if (!sourceEntity || !targetEntity) {
        return;
      }

      links.push({
        source: relationship.sourceId,
        target: relationship.targetId,
        sourceType: sourceEntity.type,
        targetType: targetEntity.type,
        type: relationship.type,
      });
    });

    return { nodes, links };
  }, [entities, relationships]);

  // Los datos sin procesar que se muestran en el visor de JSON
  const jsonData = useMemo(
    () => ({ entities, relationships }),
    [entities, relationships],
  );

  const selectedEntity = entities.find((entity) => entity.id === selectedId);

  const activeNeighborhood = useMemo(() => {
    if (!selectedId) return new Set<string>();

    const relatedIds = new Set([selectedId]);
    relationships.forEach((relationship) => {
      if (relationship.sourceId === selectedId) relatedIds.add(relationship.targetId);
      if (relationship.targetId === selectedId) relatedIds.add(relationship.sourceId);
    });
    return relatedIds;
  }, [relationships, selectedId]);

  const outgoingRelationships = selectedEntity
    ? relationships.filter((relationship) => relationship.sourceId === selectedEntity.id)
    : [];
  const incomingRelationships = selectedEntity
    ? relationships.filter((relationship) => relationship.targetId === selectedEntity.id)
    : [];
  const selectedRelationshipCount = outgoingRelationships.length + incomingRelationships.length;

  const toggleEntityType = (type: EntityType) => {
    const isActive = activeTypes.includes(type);
    setActiveTypes((currentTypes) =>
      isActive
        ? currentTypes.filter((currentType) => currentType !== type)
        : [...currentTypes, type],
    );
    if (isActive && selectedEntity?.type === type) {
      setSelectedId(null);
      setSearchText("");
    }
  };

  const handleNodeClick = (node: { id?: string | number }) => {
    if (node.id === undefined) {
      return;
    }

    const id = String(node.id);
    setSelectedId(id);
    setSearchText(entities.find((entity) => entity.id === id)?.name ?? "");
  };

  const focusEntity = (entity: Entity | null) => {
    if (!entity) {
      setSelectedId(null);
      setSearchText("");
      return;
    }

    setSelectedId(entity.id);
    setSearchText(entity.name);
    setActiveTypes((current) =>
      current.includes(entity.type) ? current : [...current, entity.type],
    );

    const node = graphData.nodes.find((item) => item.id === entity.id);
    if (node?.x !== undefined && node.y !== undefined) {
      graphRef.current?.centerAt(node.x, node.y, 450);
      graphRef.current?.zoom(Math.max(graphRef.current.zoom(), 1.6), 450);
    }
  };

  // Solo se ejecuta al hacer clic, por lo que leer la referencia aquí es seguro.
  const handleZoom = (action: ZoomAction) => {
    const graph = graphRef.current;

    if (!graph) {
      return;
    }

    if (action === "fit") {
      graph.zoomToFit(400, 40);
      return;
    }

    const factor = action === "in" ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;

    graph.zoom(graph.zoom() * factor, ZOOM_DURATION_MS);
  };

  const handleSubmitForm = async (values: EntityInput) => {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    let savedEntity: Entity | undefined;
    try {
      const isEditing = formState?.mode === "edit";
      savedEntity = isEditing
        ? await updateEntity(formState.entity.id, { name: values.name, type: values.type })
        : await createEntity(values);
      setSelectedId(savedEntity.id);
      setSearchText(savedEntity.name);
      // The node is already saved. Close the form before adding connections so
      // a failed relationship cannot cause an accidental duplicate on retry.
      setFormState(null);
      if (!isEditing) {
        for (const targetId of values.connectedIds) {
          await createRelationship({ sourceId: savedEntity.id, targetId, type: values.relationType });
        }
      }
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar el nodo.";
      if (savedEntity) {
        await loadData().catch(() => undefined);
        setError(`El nodo se guardó, pero no se pudo completar la operación. ${message}`);
      } else {
        setError(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedEntity || isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await deleteEntity(selectedEntity.id);
      setIsDeleteOpen(false);
      setSelectedId(null);
      setSearchText("");
      await loadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo eliminar el nodo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4">Grafo</Typography>
      {error && !formState && !isDeleteOpen && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Hacé clic en un nodo para seleccionarlo: desde ahí podés abrir su nota,
        editarlo o eliminarlo. Usá la rueda o los botones para acercar y alejar.
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
        }}
      >
        <Autocomplete
          options={entities}
          value={selectedEntity ?? null}
          inputValue={searchText}
          getOptionLabel={(entity) => entity.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(_, entity) => focusEntity(entity)}
          onInputChange={(_, value) => setSearchText(value)}
          noOptionsText="No se encontraron entidades"
          sx={{ width: { xs: "100%", sm: 300 } }}
          renderInput={(params) => (
            <TextField {...params} size="small" placeholder="Buscar entidad…" />
          )}
        />

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {entityTypes.map((type) => {
            const isActive = activeTypes.includes(type);

            return (
              <Chip
                key={type}
                label={type}
                onClick={() => toggleEntityType(type)}
                variant={isActive ? "filled" : "outlined"}
                sx={{
                  bgcolor: isActive ? entityTypeColors[type] : undefined,
                  color: isActive ? "#0E0D17" : undefined,
                  fontWeight: 600,
                }}
              />
            );
          })}
          {activeTypes.length < entityTypes.length && (
            <Button
              size="small"
              startIcon={<RestartAltIcon />}
              onClick={() => setActiveTypes(entityTypes)}
            >
              Restablecer filtros
            </Button>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DataObjectIcon />}
            onClick={() => setIsJsonOpen(true)}
          >
            Ver JSON
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormState({ mode: "create" })}
          >
            Nuevo nodo
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: selectedEntity
            ? { xs: "1fr", lg: "minmax(0, 1fr) 300px" }
            : "1fr",
          alignItems: "start",
          gap: 2,
        }}
      >
      <Card
        ref={containerRef}
        variant="outlined"
        sx={{
          position: "relative",
          overflow: "hidden",
          minWidth: 0,
          background:
            "radial-gradient(circle at 50% 40%, #1D1A3A 0%, #0E0D17 75%)",
        }}
      >
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          width={graphWidth}
          height={graphHeight}
          backgroundColor="rgba(0,0,0,0)"
          autoPauseRedraw={false}
          nodeLabel={() => ""}
          nodeColor={(node) => {
            const graphNode = node as GraphNode;
            return selectedId && !activeNeighborhood.has(graphNode.id)
              ? "#464454"
              : graphNode.color;
          }}
          nodeRelSize={7}
          nodeVisibility={(node) =>
            activeTypes.includes((node as GraphNode).type)
          }
          linkVisibility={(link) => {
            const graphLink = link as GraphLink;

            return (
              activeTypes.includes(graphLink.sourceType) &&
              activeTypes.includes(graphLink.targetType)
            );
          }}
          linkLabel={(link) => (link as GraphLink).type}
          linkColor={(link) => {
            const graphLink = link as GraphLink;
            const sourceId = typeof graphLink.source === "object"
              ? String((graphLink.source as unknown as GraphNode).id)
              : String(graphLink.source);
            const targetId = typeof graphLink.target === "object"
              ? String((graphLink.target as unknown as GraphNode).id)
              : String(graphLink.target);
            const isFocused = activeNeighborhood.has(sourceId) && activeNeighborhood.has(targetId);
            return selectedId
              ? isFocused ? "rgba(167,139,250,.72)" : "rgba(255,255,255,.045)"
              : "rgba(255,255,255,.2)";
          }}
          linkDirectionalArrowLength={4}
          onEngineStop={() => {
            if (!hasInitialFit.current && graphData.nodes.length > 0) {
              hasInitialFit.current = true;
              graphRef.current?.zoomToFit(450, 72);
            }
          }}
          nodeCanvasObjectMode={() => "after"}
          nodeCanvasObject={(node, context, globalScale) => {
            const graphNode = node as GraphNode;

            if (!activeTypes.includes(graphNode.type)) {
              return;
            }

            context.beginPath();
            context.arc(node.x ?? 0, node.y ?? 0, 10, 0, 2 * Math.PI);
            context.strokeStyle = graphNode.color;
            context.globalAlpha = graphNode.id === selectedId ? 0.85 : 0.3;
            context.lineWidth = 1.5 / globalScale;
            context.stroke();
            context.globalAlpha = 1;

            // El anillo identifica el nodo seleccionado.
            if (graphNode.id === selectedId) {
              context.beginPath();
              context.arc(node.x ?? 0, node.y ?? 0, 10, 0, 2 * Math.PI);
              context.strokeStyle = "#FFFFFF";
              context.lineWidth = 2 / globalScale;
              context.stroke();
            }

            // Mantiene el grafo legible y muestra etiquetas solo al explorar un nodo.
            if (graphNode.id !== selectedId && graphNode.id !== hoveredId) {
              return;
            }

            context.font = `${12 / globalScale}px "Segoe UI", sans-serif`;
            context.textAlign = "center";
            context.textBaseline = "top";
            context.fillStyle = "#E8E7F5";
            const labelX = node.x ?? 0;
            const labelY = (node.y ?? 0) + 13;
            const labelWidth = context.measureText(graphNode.name).width;
            context.fillStyle = "rgba(10,9,18,.88)";
            context.fillRect(
              labelX - labelWidth / 2 - 4 / globalScale,
              labelY - 2 / globalScale,
              labelWidth + 8 / globalScale,
              17 / globalScale,
            );
            context.fillStyle = "#E8E7F5";
            context.fillText(graphNode.name, labelX, labelY);
          }}
          onNodeClick={handleNodeClick}
          onNodeHover={(node) => setHoveredId(node ? String(node.id) : null)}
          onBackgroundClick={() => setSelectedId(null)}
        />

        {activeTypes.length === 0 && (
          <Alert
            severity="info"
            sx={{ position: "absolute", top: 16, left: 16, right: 72 }}
            action={
              <Button
                color="inherit"
                size="small"
                startIcon={<RestartAltIcon />}
                onClick={() => setActiveTypes(entityTypes)}
              >
                Restablecer
              </Button>
            }
          >
            Activá al menos un tipo para volver a mostrar entidades.
          </Alert>
        )}

        {/* Controles de zoom, flotando sobre el gráfico */}
        <Box
          sx={{
            position: "absolute",
            right: 12,
            bottom: 12,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
          }}
        >
          {zoomButtons.map((button) => (
            <Tooltip key={button.label} title={button.label} placement="left">
              <IconButton
                aria-label={button.label}
                onClick={() => handleZoom(button.action)}
                sx={{
                  bgcolor: "rgba(255,255,255,.08)",
                  border: 1,
                  borderColor: "divider",
                  backdropFilter: "blur(6px)",
                  "&:hover": { bgcolor: "rgba(255,255,255,.16)" },
                }}
              >
                {button.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      </Card>

      {selectedEntity && (
        <Card variant="outlined" sx={{ p: 2.5, alignSelf: "start" }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1 }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Chip
                size="small"
                label={selectedEntity.type}
                sx={{
                  bgcolor: entityTypeColors[selectedEntity.type],
                  color: "#0E0D17",
                  fontWeight: 600,
                  mb: 1,
                }}
              />
              <Typography variant="h6" sx={{ overflowWrap: "anywhere" }}>
                {selectedEntity.name}
              </Typography>
            </Box>
            <IconButton
              size="small"
              aria-label="Quitar selección"
              onClick={() => focusEntity(null)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Fuente: {selectedEntity.source}
          </Typography>

          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Datos</Typography>
          <Box sx={{ display: "grid", gap: 1, mb: 2 }}>
            {Object.entries(selectedEntity.data).map(([key, value]) => (
              <Box key={key} sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                <Typography variant="caption" color="text.secondary">{key}</Typography>
                <Typography variant="body2" sx={{ textAlign: "right", overflowWrap: "anywhere" }}>{value}</Typography>
              </Box>
            ))}
          </Box>

          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="subtitle2">
            Conexiones <Typography component="span" variant="caption" color="text.secondary">({selectedRelationshipCount})</Typography>
          </Typography>
          {selectedRelationshipCount > 0 ? (
            <List dense disablePadding sx={{ my: 0.5, maxHeight: 220, overflowY: "auto" }}>
              {[
                ...outgoingRelationships.map((relationship) => ({
                  entityId: relationship.targetId,
                  relation: relationship.type,
                })),
                ...incomingRelationships.map((relationship) => ({
                  entityId: relationship.sourceId,
                  relation: relationship.type,
                })),
              ].map((item, index) => {
                const relatedEntity = entities.find((entity) => entity.id === item.entityId);
                if (!relatedEntity) return null;

                return (
                  <ListItemButton
                    key={`${item.entityId}-${item.relation}-${index}`}
                    onClick={() => focusEntity(relatedEntity)}
                    sx={{ px: 1, borderRadius: 1 }}
                  >
                    <ListItemText
                      primary={relatedEntity.name}
                      secondary={item.relation}
                      slotProps={{
                        primary: { variant: "body2", noWrap: true },
                        secondary: { variant: "caption" },
                      }}
                    />
                    <Chip
                      size="small"
                      label={relatedEntity.type}
                      sx={{
                        ml: 1,
                        bgcolor: `${entityTypeColors[relatedEntity.type]}22`,
                        color: entityTypeColors[relatedEntity.type],
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
              Esta entidad todavía no tiene conexiones.
            </Typography>
          )}

          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Button size="small" onClick={() => navigate(`/entidad/${selectedEntity.id}`)}>
              Ver nota
            </Button>
            <Tooltip title="Editar">
              <IconButton
                size="small"
                aria-label="Editar nodo"
                onClick={() => setFormState({ mode: "edit", entity: selectedEntity })}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
              <IconButton size="small" aria-label="Eliminar nodo" onClick={() => setIsDeleteOpen(true)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Card>
      )}
      </Box>

      {formState && (
        <NodeFormDialog
          isSubmitting={isSaving}
          error={error}
          entities={entities}
          entityToEdit={
            formState.mode === "edit" ? formState.entity : undefined
          }
          onClose={() => setFormState(null)}
          onSubmit={handleSubmitForm}
        />
      )}

      <Dialog
        open={isDeleteOpen}
        onClose={isSaving ? undefined : () => setIsDeleteOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Eliminar nodo</DialogTitle>

        <DialogContent sx={{ display: "grid", gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <DialogContentText>
            Se va a eliminar "{selectedEntity?.name}" junto con sus{" "}
            {selectedRelationshipCount} relaciones. Esta acción no se puede
            deshacer.
          </DialogContentText>

          {selectedEntity && selectedEntity.source !== "Manual" && (
            <Alert severity="info">
              Este nodo viene de la fuente "{selectedEntity.source}". En el
              sistema real podría volver a aparecer al sincronizarla.
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsDeleteOpen(false)} disabled={isSaving}>Cancelar</Button>

          <Button
            color="error"
            variant="contained"
            disabled={isSaving}
            onClick={handleConfirmDelete}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* JSON viewer panel */}
      <Drawer
        anchor="right"
        open={isJsonOpen}
        onClose={() => setIsJsonOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "100%", sm: 520 },
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            bgcolor: "background.default",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">JSON cargado</Typography>

            <Typography variant="body2" color="text.secondary">
              Son los datos que alimentan el grafo. Se actualizan al crear,
              editar o eliminar nodos.
            </Typography>
          </Box>

          <IconButton aria-label="Cerrar" onClick={() => setIsJsonOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <JsonViewer data={jsonData} fileName="knowledge-system.json" />
      </Drawer>
    </Box>
  );
}
