import { env } from "bun";
import { createClient } from "redis";

const baseRedisClient = createClient({
    url: env.REDIS_URL,
    socket: {
        reconnectStrategy: false,
        connectTimeout: 1000,
        keepAlive: 1000,
    },
    disableOfflineQueue: true,
    
});

baseRedisClient.on("error", (err) => {
    console.error("Redis error:", err);
});

export const redisClient = await baseRedisClient.connect();

enum HeartbeatStatus {
    INACTIVE,
    ACTIVE,
    PAUSED,
}

// This is a workaround for a bug in the redis client.
export const manualPing = (client: typeof baseRedisClient) => {
    let heartbeatStatus = HeartbeatStatus.INACTIVE;
    return async () => {
        if (heartbeatStatus === HeartbeatStatus.PAUSED) {
            console.warn('Heartbeat paused')
            return;
        }

        if (!client.isOpen) {
            console.warn('Redis disconnected')
            heartbeatStatus = HeartbeatStatus.PAUSED;
            await client.connect();

            console.warn('Redis reconnected')
            heartbeatStatus = HeartbeatStatus.INACTIVE;
            return;
        }

        if (heartbeatStatus === HeartbeatStatus.ACTIVE) {
            console.error('Heartbeat timeout')
            heartbeatStatus = HeartbeatStatus.PAUSED;
            await client.disconnect();
            
            heartbeatStatus = HeartbeatStatus.INACTIVE;
            console.error('Disconnected')
            return;
        }

        heartbeatStatus = HeartbeatStatus.ACTIVE;
        await client.ping();
        heartbeatStatus = HeartbeatStatus.INACTIVE;
    }
}
