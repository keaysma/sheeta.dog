import type { EntityType, PhysicsData, WorldState } from "./shared";

export enum ServerMessageType {
    Update = 'update',
    Joined = 'joined',
    Left = 'left',
    Identify = 'you are',
    Woof = 'woof',
}

export interface BaseServerMessage {
    type: ServerMessageType;
    id: string;
}

export interface ServerUpdateMessage extends BaseServerMessage {
    type: ServerMessageType.Update;
    message: PhysicsData;
}

export interface ServerJoinedMessage extends BaseServerMessage {
    type: ServerMessageType.Joined;
    entityType: EntityType;
    message: PhysicsData;
}

export interface ServerLeftMessage extends BaseServerMessage {
    type: ServerMessageType.Left;
}

export interface ServerIdentifyMessage extends BaseServerMessage {
    type: ServerMessageType.Identify;
    worldState: WorldState;
}

export interface ServerWoofMessage extends BaseServerMessage {
    type: ServerMessageType.Woof;
}

export type ServerMessage = ServerUpdateMessage | ServerJoinedMessage | ServerLeftMessage | ServerIdentifyMessage | ServerWoofMessage;