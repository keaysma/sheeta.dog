import { env } from "bun";
import { createClient } from "redis";

export const redis = await createClient({
    url: env.REDIS_URL,
}).connect();
