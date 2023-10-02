import type { PhysicsData } from "./shared";


export enum ClientMessageType {
    Position = 'position',
    Woof = 'woof',
    Poo = 'stinky poo',
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

export interface ClientPooMessage extends BaseClientMessage {
    type: ClientMessageType.Poo;
}

export type ClientMessage = 
    | ClientRenameMessage 
    | ClientPositionMessage 
    | ClientWoofMessage 
    | ClientPooMessage