import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  AppBar,
  Toolbar,
  InputBase,
  Avatar,
  IconButton,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import StorageIcon from "@mui/icons-material/Storage";
import HubIcon from "@mui/icons-material/Hub";
import SearchIcon from "@mui/icons-material/Search";

import Footer from "./Footer";
import { getEntities, getSources } from "../services/api";
import type { Entity, Source } from "../types";

const DRAWER_WIDTH = 240;

type GlobalSearchResult = {
  key: string;
  kind: "Entidad" | "Fuente";
  label: string;
  detail: string;
  to: string;
};

const navigationItems = [
  { to: "/", label: "Inicio", icon: <DashboardIcon /> },
  { to: "/fuentes", label: "Fuentes", icon: <StorageIcon /> },
  { to: "/grafo", label: "Grafo", icon: <HubIcon /> },
];

export default function Layout() {
  const { pathname } = useLocation();
  const theme = useTheme();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [highlightedResultIndex, setHighlightedResultIndex] = useState(0);
  const [searchEntities, setSearchEntities] = useState<Entity[]>([]);
  const [searchSources, setSearchSources] = useState<Source[]>([]);

  const refreshSearchData = useCallback(() => {
    Promise.all([getEntities(), getSources()]).then(([loadedEntities, loadedSources]) => {
      setSearchEntities(loadedEntities);
      setSearchSources(loadedSources);
    });
  }, []);

  useEffect(() => {
    refreshSearchData();
  }, [refreshSearchData]);

  const searchResults = useMemo<GlobalSearchResult[]>(() => {
    const query = searchText.trim().toLocaleLowerCase("es-AR");
    if (!query) return [];

    const entityResults = searchEntities
      .filter((entity) =>
        `${entity.name} ${entity.type} ${entity.source}`
          .toLocaleLowerCase("es-AR")
          .includes(query),
      )
      .map((entity) => ({
        key: `entity-${entity.id}`,
        kind: "Entidad" as const,
        label: entity.name,
        detail: `${entity.type} · ${entity.source}`,
        to: `/entidad/${entity.id}`,
      }));

    const sourceResults = searchSources
      .filter((source) =>
        `${source.name} ${source.type} ${source.status}`
          .toLocaleLowerCase("es-AR")
          .includes(query),
      )
      .map((source) => ({
        key: `source-${source.id}`,
        kind: "Fuente" as const,
        label: source.name,
        detail: `${source.type} · ${source.status === "ok" ? "Funcionando" : "Con error"}`,
        to: `/fuentes?buscar=${encodeURIComponent(source.name)}`,
      }));

    return [...entityResults, ...sourceResults].slice(0, 8);
  }, [searchEntities, searchSources, searchText]);

  const openSearchResult = (result: GlobalSearchResult) => {
    navigate(result.to);
    setSearchText("");
    setIsSearchFocused(false);
    closeMobileMenu();
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setSearchText("");
      setIsSearchFocused(false);
    } else if (event.key === "ArrowDown" && searchResults.length) {
      event.preventDefault();
      setHighlightedResultIndex((current) => (current + 1) % searchResults.length);
    } else if (event.key === "ArrowUp" && searchResults.length) {
      event.preventDefault();
      setHighlightedResultIndex((current) =>
        (current - 1 + searchResults.length) % searchResults.length,
      );
    } else if (event.key === "Enter" && searchResults[highlightedResultIndex]) {
      openSearchResult(searchResults[highlightedResultIndex]);
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const drawerContent = (
    <>
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4, px: 1 }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(135deg, #8B6CFF 0%, #2DD4BF 100%)",
            color: "#0E0D17",
          }}
        >
          <HubIcon fontSize="small" />
        </Box>

        <Typography variant="h6">Knowledge System</Typography>
      </Box>

      <List>
        {navigationItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={closeMobileMenu}
            // "/" matches every route, so Inicio is selected only on the exact path
            selected={
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to)
            }
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: "text.secondary",
              "&.Mui-selected": {
                bgcolor: "rgba(139,108,255,.16)",
                color: "primary.light",
              },
              "&.Mui-selected:hover": {
                bgcolor: "rgba(139,108,255,.22)",
              },
              "&:hover": { bgcolor: "rgba(255,255,255,.05)" },
            }}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>

            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Drawer
        variant={isDesktop ? "permanent" : "temporary"}
        open={isDesktop || isMobileMenuOpen}
        onClose={closeMobileMenu}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: isDesktop ? DRAWER_WIDTH : undefined,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            bgcolor: "#0A0912",
            borderRight: 1,
            borderColor: "divider",
            p: 2,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Column layout so the footer always stays at the bottom */}
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <AppBar
          position="sticky"
          color="transparent"
          elevation={0}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            backdropFilter: "blur(10px)",
            bgcolor: "rgba(14,13,23,.8)",
          }}
        >
          <Toolbar sx={{ gap: 2 }}>
            {!isDesktop && (
              <IconButton
                edge="start"
                aria-label="Abrir menú"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Box
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "rgba(255,255,255,.05)",
                border: 1,
                borderColor: "divider",
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                width: { xs: "100%", sm: 360 },
                minWidth: 0,
              }}
            >
              <SearchIcon fontSize="small" color="disabled" />

              <InputBase
                placeholder="Buscar entidades y fuentes…"
                value={searchText}
                onChange={(event) => {
                  setSearchText(event.target.value);
                  setHighlightedResultIndex(0);
                }}
                onFocus={() => {
                  setIsSearchFocused(true);
                  refreshSearchData();
                }}
                onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 120)}
                onKeyDown={handleSearchKeyDown}
                inputProps={{
                  "aria-label": "Buscar entidades y fuentes",
                  "aria-autocomplete": "list",
                  "aria-expanded": isSearchFocused && Boolean(searchText.trim()),
                  "aria-controls": isSearchFocused && searchText.trim()
                    ? "global-search-results"
                    : undefined,
                  "aria-activedescendant": searchResults.length
                    ? `global-search-option-${highlightedResultIndex}`
                    : undefined,
                }}
                fullWidth
              />

              {isSearchFocused && Boolean(searchText.trim()) && (
                <Paper
                  component="ul"
                  id="global-search-results"
                  role="listbox"
                  elevation={12}
                  sx={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    left: 0,
                    right: 0,
                    zIndex: 1300,
                    maxHeight: 360,
                    overflowY: "auto",
                    p: 0.75,
                    m: 0,
                    listStyle: "none",
                  }}
                >
                  {searchResults.length ? (
                    searchResults.map((result, index) => (
                      <ListItemButton
                        key={result.key}
                        id={`global-search-option-${index}`}
                        component="li"
                        role="option"
                        aria-selected={highlightedResultIndex === index}
                        onMouseEnter={() => setHighlightedResultIndex(index)}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => openSearchResult(result)}
                        sx={{
                          display: "block",
                          borderRadius: 1.5,
                          py: 1,
                          bgcolor: highlightedResultIndex === index
                            ? "rgba(139,108,255,.14)"
                            : undefined,
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                            {result.label}
                          </Typography>
                          <Typography variant="caption" color="primary.light">
                            {result.kind}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {result.detail}
                        </Typography>
                      </ListItemButton>
                    ))
                  ) : (
                    <Typography sx={{ px: 1.5, py: 2 }} variant="body2" color="text.secondary">
                      No encontré entidades ni fuentes con ese texto.
                    </Typography>
                  )}
                </Paper>
              )}
            </Box>

            <Box sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }} />

            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 34,
                height: 34,
                display: { xs: "none", sm: "flex" },
              }}
            >
              U
            </Avatar>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>
          <Outlet />
        </Box>

        <Footer />
      </Box>
    </Box>
  );
}
