import { env } from "bun";
import { createClient } from "redis";

export const redisClient = await createClient({
    url: env.REDIS_URL,
}).connect();
