import type { EntityData, WorldState } from "./types/shared";
import { redis } from "./redis";

const WORLDSTATE_HSET_KEY = "worldState"

export const getEntity = async (id: string): Promise<EntityData | null> => {
    const entity = await redis.hGet(WORLDSTATE_HSET_KEY, id);
    return entity ? JSON.parse(entity) : null;
}

export const upsertEntity = async (id: string, data: EntityData) => {
    await redis.hSet(WORLDSTATE_HSET_KEY, id, JSON.stringify(data));
}

export const removeEntity = async (id: string) => {
    await redis.hDel(WORLDSTATE_HSET_KEY, id);
}

export const getAllEntities = async (): Promise<WorldState> => {
    const worldState = await redis.hGetAll(WORLDSTATE_HSET_KEY);
    return Object.fromEntries(
        Object.entries(worldState).map(([id, data]) => [id, JSON.parse(data)])
    );
}

export const hasEntity = async (id: string) => {
    return await redis.hExists(WORLDSTATE_HSET_KEY, id);
}
