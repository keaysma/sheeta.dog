import { ClientMessage, ClientMessageType } from "./types/client";
import { ServerIdentifyMessage, ServerJoinedMessage, ServerLeftMessage, ServerMessageType, ServerUpdateMessage, ServerWoofMessage } from "./types/server";
import { EntityData, EntityType, WorldState } from "./types/shared";
import { serve } from "bun";

const STATE: WorldState = {};

const server = serve<{ id: string, name: string | null }>({
    port: 3000,
    fetch(req, server) {
        const url = new URL(req.url);
        console.log(url.href)
        if (url.pathname === "/connect") {
            const name = url.searchParams.get("name");
            const id = Math.random().toString(16).substring(2).toUpperCase();
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
        open(ws) {
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
            STATE[id] = {
                type: EntityType.Dog,
                position,
                rotation,
            };

            const response: ServerIdentifyMessage = {
                type: ServerMessageType.Identify,
                id,
                worldState: STATE,
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
            ws.publish("game", JSON.stringify(joined));
        },
        message(ws, messageRaw) {
            const { id, name } = ws.data;

            if (!STATE[id]) {
                console.log('No state for', id)
                ws.close();
                return;
            }

            const messageString = messageRaw.toString();
            const message: ClientMessage = JSON.parse(messageString);

            switch (message.type) {
                case ClientMessageType.Position:
                    STATE[id].position = message.position;
                    STATE[id].rotation = message.rotation;

                    const update: ServerUpdateMessage = {
                        type: ServerMessageType.Update,
                        id,
                        message,
                    }
                    ws.publish("game", JSON.stringify(update));
                    break;
                case ClientMessageType.Woof:
                    const woof: ServerWoofMessage = {
                        type: ServerMessageType.Woof,
                        id,
                    }
                    const payload = JSON.stringify(woof);
                    ws.cork(() => {
                        ws.publish("game", payload);
                        ws.send(payload);
                    })
                    break;
                case ClientMessageType.Poo:
                    if (!name) break;

                    const existingPoo = Object.values(STATE).find(entity => entity.type === EntityType.Poo && entity.name === name);
                    if (existingPoo) {
                        existingPoo.position = STATE[id].position;
                        existingPoo.rotation = STATE[id].rotation;

                        const pooUpdate: ServerUpdateMessage = {
                            type: ServerMessageType.Update,
                            id: name,
                            message: existingPoo,
                        }
                        const pooUpdatePayload = JSON.stringify(pooUpdate);
                        ws.cork(() => {
                            ws.publish("game", pooUpdatePayload);
                            ws.send(pooUpdatePayload);
                        })
                    } else {
                        const newPoo: EntityData = {
                            type: EntityType.Poo,
                            position: STATE[id].position,
                            rotation: STATE[id].rotation,
                            name,
                        }
                        STATE[name] = newPoo;

                        const pooJoined: ServerJoinedMessage = {
                            type: ServerMessageType.Joined,
                            id: name,
                            entityType: EntityType.Poo,
                            message: newPoo,
                        }
                        const pooJoinedPayload = JSON.stringify(pooJoined);
                        ws.cork(() => {
                            ws.publish("game", pooJoinedPayload);
                            ws.send(pooJoinedPayload);
                        })
                    }
                    break;
                case ClientMessageType.Rename:
                    STATE[id].name = message.name;
                    break;
                default:
                    console.log('Unknown message type', message)
            }
        },
        idleTimeout: 10, // seconds 
        close(ws) {
            const { id } = ws.data;

            delete STATE[id];

            const response: ServerLeftMessage = {
                type: ServerMessageType.Left,
                id,
            }

            // ws.publish("game", JSON.stringify(response));
            server.publish("game", JSON.stringify(response));
        },
    },
})

console.log('Server started on port 3000')
