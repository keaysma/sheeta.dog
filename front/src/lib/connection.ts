import { ServerMessageType, type ServerMessage } from "../types/server";
import { addAudioAtPosition, addPlayer, player, scene, updatePlayer } from "./world";
import { ClientMessageType, type ClientPingMessage, type ClientPositionMessage, type ClientWoofMessage } from "../types/client";
import type { Body } from "cannon-es";
import { WOOF_AUDIO_FILE_PATHS } from "./consts";

export let server: WebSocket;
let terminated: boolean = false;
let pingIntervalId: number;
let updateIntervalId: number;

export function woof() {
    const message: ClientWoofMessage = {
        type: ClientMessageType.Woof
    };
    server.send(JSON.stringify(message));
}

function onMessage(message: MessageEvent<string>) {
    const data: ServerMessage = JSON.parse(message.data);

    if (data.type !== ServerMessageType.Update) console.debug(data);

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
        case ServerMessageType.Woof:
            console.log('woof');
            // const audio = new Audio(WOOF_AUDIO_FILE_PATHS[Math.floor(Math.random() * WOOF_AUDIO_FILE_PATHS.length)]);
            // audio.play()

            const woofPlayer = scene.getObjectByName(data.id);
            if (woofPlayer) {
                addAudioAtPosition(
                    woofPlayer.position,
                    WOOF_AUDIO_FILE_PATHS[Math.floor(Math.random() * WOOF_AUDIO_FILE_PATHS.length)]
                )
            }
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

function updateLoop() {
    const playerBody: Body = player.userData.body;

    if (
        !playerBody.velocity.isZero() ||
        !playerBody.angularVelocity.isZero()
    ) {
        const message: ClientPositionMessage = {
            type: ClientMessageType.Position,
            position: player.position,
            rotation: {
                x: player.quaternion.x,
                y: player.quaternion.y,
                z: player.quaternion.z,
                w: player.quaternion.w
            }
        };
        server.send(JSON.stringify(message));
    }
}

function onOpen() {
    pingIntervalId = setInterval(pingLoop, 5_000)
    updateIntervalId = setInterval(updateLoop, 5)
}

function onClose() {
    clearInterval(updateIntervalId)
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
    server = new WebSocket(`ws://192.168.0.102:3000/connect`)
    server.onmessage = onMessage
    server.onclose = onClose
    server.onopen = onOpen
}