export interface PhysicsData {
    position: {
        x: number;
        y: number;
        z: number;
    }
    rotation: {
        x: number;
        y: number;
        z: number;
        w: number;
    }

    // TODO: Add velocity, angular velocity
}

export enum EntityType {
    Dog = 'dog',
    Poo = 'poo',
}

export interface EntityData extends PhysicsData {
    type: EntityType;
    name?: string;
}

export type WorldState = Record<string, EntityData>;
