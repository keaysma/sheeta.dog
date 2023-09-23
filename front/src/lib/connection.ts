import { ServerMessageType, type ServerMessage } from "../types/server";
import { addPlayer, player, scene, updatePlayer } from "./world";
import { ClientMessageType, type ClientPingMessage } from "../types/client";

export let server: WebSocket;
let terminated: boolean = false;
let pingIntervalId: number;

function onMessage(message: MessageEvent<string>) {
    const data: ServerMessage = JSON.parse(message.data);

    if (data.type !== ServerMessageType.Update) console.log(data);

    switch (data.type) {
        case ServerMessageType.Identify:
            player.name = data.id;
            Object.entries(data.worldState).forEach(([id, message]) => {
                if (id === player.name) {
                    updatePlayer(player, message);
                } else {
                    addPlayer(id, message);
                }
            });
            break;
        case ServerMessageType.Joined:
            const existingPlayer = scene.getObjectByName(data.id);
            if (existingPlayer) {
                updatePlayer(existingPlayer, data.message);
            } else {
                addPlayer(data.id, data.message);
            }
            break;
        case ServerMessageType.Update:
            if (data.id === player.name) {
                break;
            }

            const updatee = scene.getObjectByName(data.id);
            if (updatee) {
                updatePlayer(updatee, data.message);
            }
            // else {
            // 	addPlayer(data.id, data.message);
            // }
            break;
        case ServerMessageType.Left:
            const leavingPlayer = scene.getObjectByName(data.id);
            if (leavingPlayer) {
                scene.remove(leavingPlayer);
            }
            break;
    }
}

function pingLoop() {
    if (server && server.readyState === server.OPEN) {
        const message: ClientPingMessage = {
            type: ClientMessageType.Ping
        };
        server.send(JSON.stringify(message));
    }
}

function onOpen() {
    pingIntervalId = setInterval(pingLoop, 5_000)
}

function onClose() {
    clearInterval(pingIntervalId)

    if (!terminated)
        setTimeout(() => {
            init()
        }, 1_000)
}

export function terminateServer() {
    terminated = true;
    server?.close();
}

export const init = () => {
    if (server && server.readyState !== server.CLOSED) {
        server.close();
        return;
    }

    terminated = false;

    // server = new WebSocket(`ws://${location.host}/connect`)
    server = new WebSocket(`ws://localhost:3000/connect`)
    server.onmessage = onMessage
    server.onclose = onClose
    server.onopen = onOpen
}