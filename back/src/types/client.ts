import type { PhysicsData } from "./shared";


export enum ClientMessageType {
    Position = 'position',
    Woof = 'woof',
    Rename = 'my name is',
}

export interface BaseClientMessage {
    type: ClientMessageType;
}

export interface ClientRenameMessage extends BaseClientMessage {
    type: ClientMessageType.Rename;
    name: string;
}

export interface ClientPositionMessage extends BaseClientMessage, PhysicsData {
    type: ClientMessageType.Position;
}

export interface ClientWoofMessage extends BaseClientMessage {
    type: ClientMessageType.Woof;
}

export type ClientMessage = ClientRenameMessage | ClientPositionMessage | ClientWoofMessage;