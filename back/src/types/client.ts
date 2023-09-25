import type { PositionPayload } from "./shared";


export enum ClientMessageType {
    Ping = 'ping',
    Position = 'position',
    Woof = 'woof',
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

export interface ClientWoofMessage extends BaseClientMessage {
    type: ClientMessageType.Woof;
}

export type ClientMessage = ClientPingMessage | ClientPositionMessage | ClientWoofMessage;