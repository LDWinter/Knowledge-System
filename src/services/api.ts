import { sources, entities, relationships } from "../mocks/data";
import type {
    Source,
    Entity,
    Relationship,
    EntityType,
    EntityInput,
} from "../types";

// Simula el retraso de una solicitud real
const delay = <T,>(data: T, ms = 350): Promise<T> => new Promise((resolve) => setTimeout(() => resolve(data), ms));

// localStorage keeps prototype changes between reloads. The in-memory defaults
// remain available when storage is unavailable (for example, in restricted contexts).
const storageKeys = {
    sources: "knowledge-system:sources:v1",
    entities: "knowledge-system:entities:v1",
    relationships: "knowledge-system:relationships:v1",
};

const readStore = <T,>(key: string, fallback: T): T => {
    if (typeof window === "undefined") return fallback;

    try {
        const saved = window.localStorage.getItem(key);
        if (!saved) return fallback;
        const parsed: unknown = JSON.parse(saved);
        return Array.isArray(parsed) ? (parsed as T) : fallback;
    } catch {
        return fallback;
    }
};

const writeStore = <T,>(key: string, value: T) => {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Keep the prototype usable in private/restricted browsing contexts.
    }
};

let sourceStore: Source[] = readStore(
    storageKeys.sources,
    sources.map((source) => ({ ...source })),
);
let entityStore: Entity[] = readStore(
    storageKeys.entities,
    entities.map((entity) => ({ ...entity, data: { ...entity.data } })),
);
let relationshipStore: Relationship[] = readStore(
    storageKeys.relationships,
    relationships.map((relationship) => ({ ...relationship })),
);

const persistStore = () => {
    if (typeof window === "undefined") return;
    writeStore(storageKeys.sources, sourceStore);
    writeStore(storageKeys.entities, entityStore);
    writeStore(storageKeys.relationships, relationshipStore);
};

const storedIds = entityStore
    .map((entity) => Number(entity.id.split("-").at(-1)))
    .filter(Number.isFinite);
let nextId = Math.max(99, ...storedIds) + 1;

const idPrefix: Record<EntityType, string> = {
    Cliente: "cli",
    Producto: "pro",
    Pedido: "ped",
};

export const getSources = (): Promise<Source[]> =>
    delay(sourceStore.map((source) => ({ ...source })));

export const getEntities = (): Promise<Entity[]> => delay([...entityStore]);

export const getRelationships = (): Promise<Relationship[]> =>
    delay([...relationshipStore]);

export const synchronizeSource = (id: number): Promise<void> => {
    sourceStore = sourceStore.map((source) =>
        source.id === id
            ? {
                  ...source,
                  status: "ok" as const,
                  lastSync: new Intl.DateTimeFormat("es-AR", {
                      dateStyle: "short",
                      timeStyle: "short",
                  }).format(new Date()),
              }
            : source,
    );
    persistStore();
    return delay(undefined, 200);
};

export const deleteSource = (id: number): Promise<void> => {
    sourceStore = sourceStore.filter((source) => source.id !== id);
    persistStore();
    return delay(undefined, 200);
};

export const createEntity = (input: EntityInput): Promise<Entity> => {
    const entity: Entity = {
        id: `${idPrefix[input.type]}-${nextId++}`,
        type: input.type,
        name: input.name,
        source: "Manual",
        data: { creado: new Date().toLocaleDateString("es-AR") },
    };

    entityStore = [...entityStore, entity];

    relationshipStore = [
        ...relationshipStore,
        ...input.connectedIds.map((targetId) => ({
            sourceId: entity.id,
            targetId,
            type: input.relationType,
        })),
    ];
    persistStore();

    return delay(entity, 200);
};

export const updateEntity = (
    id: string,
    changes: Pick<EntityInput, "name" | "type">,
): Promise<void> => {
    entityStore = entityStore.map((entity) =>
        entity.id === id ? { ...entity, ...changes } : entity,
    );
    persistStore();

    return delay(undefined, 200);
};

// Eliminar una entidad también elimina todas las relaciones en las que participa.
export const deleteEntity = (id: string): Promise<void> => {
    entityStore = entityStore.filter((entity) => entity.id !== id);

    relationshipStore = relationshipStore.filter(
        (relationship) =>
            relationship.sourceId !== id && relationship.targetId !== id,
    );
    persistStore();

    return delay(undefined, 200);
};
