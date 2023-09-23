import type { PositionPayload } from "./shared";


export enum ClientMessageType {
    Ping = 'ping',
    Position = 'position',
}

export interface BaseClientMessage {
    type: ClientMessageType;
}

export interface ClientPingMessage extends BaseClientMessage {
    type: ClientMessageType.Ping;
}

export interface ClientPositionMessage extends BaseClientMessage, PositionPayload {
    type: ClientMessageType.Position;
}

export type ClientMessage = ClientPingMessage | ClientPositionMessage;