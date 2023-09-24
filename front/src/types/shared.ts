export interface PositionPayload {
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
}

export type WorldState = Record<string, PositionPayload>;
