import { redisClient } from "./redis";
import type { EntityData, WorldState } from "./types/shared";

const WORLDSTATE_HSET_KEY = "worldState"

export const getEntity = async (id: string): Promise<EntityData | null> => {
    const entity = await redisClient.hGet(WORLDSTATE_HSET_KEY, id);
    return entity ? JSON.parse(entity) : null;
}

export const upsertEntity = async (id: string, data: EntityData) => {
    await redisClient.hSet(WORLDSTATE_HSET_KEY, id, JSON.stringify(data));
}

export const removeEntity = async (id: string) => {
    await redisClient.hDel(WORLDSTATE_HSET_KEY, id);
}

export const getAllEntities = async (): Promise<WorldState> => {
    const worldState = await redisClient.hGetAll(WORLDSTATE_HSET_KEY);
    return Object.fromEntries(
        Object.entries(worldState).map(([id, data]) => [id, JSON.parse(data)])
    );
}

export const hasEntity = async (id: string) => {
    return await redisClient.hExists(WORLDSTATE_HSET_KEY, id);
}
