import type { PositionPayload, WorldState } from "./shared";

export enum ServerMessageType {
    Update = 'update',
    Joined = 'joined',
    Left = 'left',
    Identify = 'you are',
    Woof = 'woof',
}

export interface BaseServerMessage {
    type: ServerMessageType;
}

export interface ServerUpdateMessage extends BaseServerMessage {
    type: ServerMessageType.Update;
    id: string;
    message: PositionPayload;
}

export interface ServerJoinedMessage extends BaseServerMessage {
    type: ServerMessageType.Joined;
    id: string;
    message: PositionPayload;
}

export interface ServerLeftMessage extends BaseServerMessage {
    type: ServerMessageType.Left;
    id: string;
}

export interface ServerIdentifyMessage extends BaseServerMessage {
    type: ServerMessageType.Identify;
    id: string;
    worldState: WorldState;
}

export interface ServerWoofMessage extends BaseServerMessage {
    type: ServerMessageType.Woof;
    id: string;
}

export type ServerMessage = ServerUpdateMessage | ServerJoinedMessage | ServerLeftMessage | ServerIdentifyMessage | ServerWoofMessage;