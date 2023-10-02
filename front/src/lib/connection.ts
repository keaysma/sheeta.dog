import { ServerMessageType, type ServerMessage } from "../types/server";
import { addAudioToObject, addPlayer, player, scene, updateEntity, upsertEntity } from "./world";
import { ClientMessageType, type ClientRenameMessage, type ClientPositionMessage, type ClientWoofMessage, type ClientPooMessage } from "../types/client";
import { Vec3, type Body } from "cannon-es";
import { WOOF_AUDIO_FILE_PATHS } from "./consts";

export let server: WebSocket;
let terminated: boolean = false;
let updateIntervalId: number;
let staticUpdateIntervalId: number;

export function woof() {
    const message: ClientWoofMessage = {
        type: ClientMessageType.Woof
    };
    server.send(JSON.stringify(message));
}

export function poop() {
    const message: ClientPooMessage = {
        type: ClientMessageType.Poo
    }
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
                    updateEntity(player, message);
                } else {
                    upsertEntity(id, message.type, message);
                }
            });
            break;
        case ServerMessageType.Joined:
            upsertEntity(data.id, data.entityType, data.message)
            break;
        case ServerMessageType.Update:
            console.log(data)
            if (data.id === player.name) {
                break;
            }

            const updatee = scene.getObjectByName(data.id);
            console.log(updatee)
            if (updatee) {
                updateEntity(updatee, data.message);
            }
            // else {
            // 	addPlayer(data.id, data.message);
            // }
            break;
        case ServerMessageType.Woof:
            const woofPlayer = scene.getObjectByName(data.id);
            if (woofPlayer) {
                addAudioToObject(
                    woofPlayer,
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

function sendPositionUpdate () {
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

function sendRename() {
    const message: ClientRenameMessage = {
        type: ClientMessageType.Rename,
        name: player.name
    }
    server.send(JSON.stringify(message))
}

function updateLoop() {
    if(!player) return;
    const playerBody: Body = player.userData.body;

    const movementThreshold = 0.01;
    const hasVelocity = playerBody.velocity.distanceTo(new Vec3(0, 0, 0)) > movementThreshold;
    const hasRotated = playerBody.angularVelocity.distanceTo(new Vec3(0, 0, 0)) > movementThreshold;

    if (
        hasVelocity || hasRotated
    ) {
        sendPositionUpdate();
    }
}

function onOpen() {
    updateIntervalId = setInterval(updateLoop, 20)
    staticUpdateIntervalId = setInterval(sendPositionUpdate, 1_000)
}

function onClose() {
    clearInterval(updateIntervalId)
    clearInterval(staticUpdateIntervalId)

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

    const name = new URLSearchParams(window.location.search).get('name');

    server = new WebSocket(`${import.meta.env.VITE_HOST}/connect?name=${name}`)
    server.onmessage = onMessage
    server.onclose = onClose
    server.onopen = onOpen
}