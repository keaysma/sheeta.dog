import { ClientMessage, ClientMessageType } from "./types/client";
import { ServerIdentifyMessage, ServerJoinedMessage, ServerLeftMessage, ServerMessage, ServerMessageType, ServerUpdateMessage, ServerWoofMessage } from "./types/server";
import { EntityType, WorldState } from "./types/shared";
import { serve } from "bun";

const STATE: WorldState = {};

const server = serve<{ id: string }>({
    port: 3000,
    fetch(req, server) {
        const url = new URL(req.url);
        console.log(url.pathname)
        if (url.pathname === "/connect") {
            if (server.upgrade(req)) {
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
            const id = Math.random().toString(16).substring(2).toUpperCase();
            ws.data = {
                id,
            }

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
            const { id } = ws.data;

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

                    const response: ServerUpdateMessage = {
                        type: ServerMessageType.Update,
                        id,
                        message,
                    }
                    ws.publish("game", JSON.stringify(response));
                    break;
                case ClientMessageType.Woof:
                    const woof: ServerWoofMessage = {
                        type: ServerMessageType.Woof,
                        id,
                    }
                    ws.publish("game", JSON.stringify(woof));
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
