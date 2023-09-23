import { ServerResponse } from "http";
import { ClientMessage, ClientMessageType } from "./types/client";
import { ServerIdentifyMessage, ServerJoinedMessage, ServerLeftMessage, ServerMessage, ServerMessageType, ServerUpdateMessage } from "./types/server";
import { PositionPayload, WorldState } from "./types/shared";
import { ServerWebSocket } from "bun";

const STATE: WorldState = {};

// because ws.publish is not working
const CLIENTS: Record<string, { ws: ServerWebSocket<{ id: string }>, lastUpdate: Date }> = {};
const publish = (message: ServerMessage) => {
    for (const { ws } of Object.values(CLIENTS)) {
        ws.send(JSON.stringify(message));
    }
}

const MAX_DEAD_TIME_MS = 10_000;
setInterval(() => {
    for (const { ws, lastUpdate } of Object.values(CLIENTS)) {
        if ((Number(new Date()) - Number(lastUpdate)) > MAX_DEAD_TIME_MS) {
            ws.close()
        }
    }
}, 10000)

Bun.serve<{ id: string }>({
    port: 3000,
    fetch(req, server) {
        const url = new URL(req.url);
        console.log(url.pathname)
        if (url.pathname === "/connect"){
            if (server.upgrade(req)) {
                console.log('upgraded!')
                return;
            }
        }

        console.log('Wiggly')
        return new Response('Wiggly')
    },
    websocket: {
        open(ws) {
            const id = Math.random().toString(16).substring(2).toUpperCase();
            ws.data = {
                id,
            }

            const position = {
                x: 4,
                y: 0,
                z: 0,
            };
            const rotation = {
                x: 0,
                y: 0,
                z: 0,
                order: 'XYZ' as const,
            };
            STATE[id] = {
                position,
                rotation,
            };

            const response: ServerIdentifyMessage = {
                type: ServerMessageType.Identify,
                id,
                worldState: STATE,
            }
            ws.send(JSON.stringify(response))

            CLIENTS[id] = {
                ws,
                lastUpdate: new Date()
            };
            const joined: ServerJoinedMessage = {
                type: ServerMessageType.Joined,
                id,
                message: {
                    position,
                    rotation,
                }
            }
            publish(joined);
        },
        message(ws, messageRaw) {
            const { id } = ws.data;

            const client = CLIENTS[id];
            if (!client) {
                ws.close()
                return;
            }

            CLIENTS[id].lastUpdate = new Date()

            const messageString = messageRaw.toString();
            const message: ClientMessage = JSON.parse(messageString);

            switch (message.type) {
                case ClientMessageType.Position:
                    STATE[id] = {
                        position: message.position,
                        rotation: message.rotation,
                    };
                    const response: ServerUpdateMessage = {
                        type: ServerMessageType.Update,
                        id,
                        message,
                    }
                    publish(response);
                    break;
                case ClientMessageType.Ping:
                    break;
                default:
                    console.log('Unknown message type', message)
            }
        },
        close(ws, code, reason) {
            console.log('Client disconnected', ws, code, reason);
            const { id } = ws.data;

            delete STATE[id];
            delete CLIENTS[id];

            const response: ServerLeftMessage = {
                type: ServerMessageType.Left,
                id,
            }

            publish(response);
        },
    },
})