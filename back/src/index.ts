import { serve } from "bun";
import { manualPing, redisClient } from "./redis";
import { ClientMessage, ClientMessageType } from "./types/client";
import { ServerIdentifyMessage, ServerJoinedMessage, ServerLeftMessage, ServerMessageType, ServerUpdateMessage, ServerWoofMessage } from "./types/server";
import { EntityData, EntityType } from "./types/shared";
import { uniqueId } from "./utils";
import * as worldState from "./worldState";

const server = serve<{ id: string, name: string | null }>({
    port: 3000,
    fetch(req, server) {
        const url = new URL(req.url);
        console.log(url.href)
        if (url.pathname === "/connect") {
            const name = url.searchParams.get("name");
            const id = uniqueId();
            if (server.upgrade(req, { data: { id, name } })) {
                console.log('upgraded!')
                return;
            }
        }

        console.log('Wiggly')
        return new Response('Wiggly')
    },
    websocket: {
        perMessageDeflate: true,
        async open(ws) {
            const position = {
                x: (Math.random() - 0.5) * 50,
                y: 1,
                z: (Math.random() - 0.5) * 50,
            };
            const rotation = {
                x: 0,
                y: 0,
                z: 0,
                w: 1,
            };

            const { id } = ws.data;
            await worldState.upsertEntity(id, {
                type: EntityType.Dog,
                position,
                rotation,
            })

            const response: ServerIdentifyMessage = {
                type: ServerMessageType.Identify,
                id,
                worldState: await worldState.getAllEntities(),
            }
            ws.send(JSON.stringify(response))

            ws.subscribe("game")

            const joined: ServerJoinedMessage = {
                type: ServerMessageType.Joined,
                id,
                entityType: EntityType.Dog,
                message: {
                    position,
                    rotation,
                }
            }
            redisClient.publish("game", JSON.stringify(joined));
        },
        async message(ws, messageRaw) {
            const { id, name } = ws.data;

            const entity = await worldState.getEntity(id);
            if (!entity) {
                console.log('No state for', id)
                ws.close();
                return;
            }

            const messageString = messageRaw.toString();
            const message: ClientMessage = JSON.parse(messageString);

            switch (message.type) {
                case ClientMessageType.Position:
                    worldState.upsertEntity(id, {
                        ... entity,
                        position: message.position,
                        rotation: message.rotation,
                    })

                    const update: ServerUpdateMessage = {
                        type: ServerMessageType.Update,
                        id,
                        message,
                    }

                    redisClient.publish("game", JSON.stringify(update))
                    break;
                case ClientMessageType.Woof:
                    const woof: ServerWoofMessage = {
                        type: ServerMessageType.Woof,
                        id,
                    }
                    redisClient.publish("game", JSON.stringify(woof))
                    break;
                case ClientMessageType.Poo:
                    if (!name) break;

                    const existingPoo = await worldState.getEntity(name);
                    if (existingPoo) {
                        existingPoo.position = entity.position;
                        existingPoo.rotation = entity.rotation;
                        worldState.upsertEntity(name, existingPoo)

                        const pooUpdate: ServerUpdateMessage = {
                            type: ServerMessageType.Update,
                            id: name,
                            message: existingPoo,
                        }
                        redisClient.publish("game", JSON.stringify(pooUpdate))
                    } else {
                        const newPoo: EntityData = {
                            type: EntityType.Poo,
                            position: entity.position,
                            rotation: entity.rotation,
                            name,
                        }
                        worldState.upsertEntity(name, newPoo)

                        const pooJoined: ServerJoinedMessage = {
                            type: ServerMessageType.Joined,
                            id: name,
                            entityType: EntityType.Poo,
                            message: newPoo,
                        }
                        redisClient.publish("game", JSON.stringify(pooJoined))
                    }
                    break;
                case ClientMessageType.Rename:
                    await worldState.upsertEntity(id, {
                        ... entity,
                        name: message.name,
                    })
                    break;
                default:
                    console.log('Unknown message type', message)
            }
        },
        idleTimeout: 10, // seconds 
        async close(ws) {
            const { id } = ws.data;

            worldState.removeEntity(id);

            const response: ServerLeftMessage = {
                type: ServerMessageType.Left,
                id,
            }

            redisClient.publish("game", JSON.stringify(response));
        },
    },
})

console.log('Server started on port 3000')

const listener = await redisClient.duplicate().connect();
await listener.subscribe("game", (message) => {
    server.publish("game", message)
});
setInterval(manualPing(redisClient), 5000);
setInterval(manualPing(listener), 5000);

console.log('Redis connected')
