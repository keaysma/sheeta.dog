import { Body, Box, Quaternion, Vec3, World, Material as CannonMaterial, ContactMaterial, Shape } from 'cannon-es';
import type { PositionPayload } from '../types/shared';
import { BoxGeometry, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, Scene, SpotLight, Vector3, Quaternion as ThreeQuaternion, WebGLRenderer, Material, BufferGeometry } from 'three';

export let renderer: WebGLRenderer;
export let camera: PerspectiveCamera;
export let scene: Scene;
export let player: Object3D;

let world: World
const groundMaterial = new CannonMaterial({ friction: 4 })
const playerMaterial = new CannonMaterial({ friction: .1 })
const contactGroundPlayer = new ContactMaterial(groundMaterial, playerMaterial, {
    friction: 1,
    frictionEquationStiffness: 100
});

let loop: boolean = true;

const positionMessageToVec3 = (position: PositionPayload['position']): Vec3 =>
    new Vec3(position.x, position.y, position.z)

const rotationMessageToQuaternion = (rotation: PositionPayload['rotation']): Quaternion =>
    new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)

const translateVector3 = (v: Vec3): Vector3 =>
    new Vector3(v.x, v.y, v.z)

const translateQuaternion = (q: Quaternion): ThreeQuaternion =>
    new ThreeQuaternion(q.x, q.y, q.z, q.w)

const animate = () => {
    if (!loop) return;

    world.fixedStep();

    const physicsEnabledObjects = scene.children.filter(
        (child) => child.userData.body
    )
    for (const ob of physicsEnabledObjects) {
        const body: Body = ob.userData.body

        ob.position.copy(translateVector3(body.position))
        ob.quaternion.copy(translateQuaternion(body.quaternion))
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

export const createPhysicsMesh = (
    {
        geometry,
        position,
        rotation,
        renderMaterial,
        mass,
        colliders,
        physicsMaterial
    }: {
        geometry: BufferGeometry,
        position: Vec3,
        rotation: Quaternion,
        renderMaterial?: Material,
        mass: number,
        colliders: (
            [Shape] & Partial<[Shape, Vec3, Quaternion]>
        )[],
        physicsMaterial?: CannonMaterial
    }
) => {
    const body = new Body({
        mass,
        position,
        quaternion: rotation,
        material: physicsMaterial,
    })
    colliders.forEach(([shape, offset, rotation]) => body.addShape(shape, offset, rotation))
    world.addBody(body)

    const meshMaterial = renderMaterial ?? new MeshBasicMaterial({ color: 0xff0000 })
    const mesh = new Mesh(geometry, meshMaterial)
    mesh.position.copy(translateVector3(position))
    mesh.quaternion.copy(translateQuaternion(rotation))
    scene.add(mesh)

    mesh.userData.body = body
    return mesh
}

export const createPhysicsBox = ({ position, rotation, size, mass, renderMaterial, physicsMaterial }: { position: Vec3, rotation: Quaternion, size: Vec3, mass: number, renderMaterial?: Material, physicsMaterial?: CannonMaterial }) => {
    return createPhysicsMesh({
        geometry: new BoxGeometry(size.x * 2, size.y * 2, size.z * 2),
        position,
        rotation,
        renderMaterial,
        mass,
        colliders: [
            [new Box(size)]
        ],
        physicsMaterial,
    })
}

export const addPlayer = (id: string, message: PositionPayload) => {
    const newPlayer = createPhysicsBox({
        position: positionMessageToVec3(message.position),
        rotation: rotationMessageToQuaternion(message.rotation),
        size: new Vec3(1, 1, 1),
        mass: 10,
        renderMaterial: new MeshBasicMaterial({ color: 0x00ff00 })
    });
    newPlayer.name = id;
    return newPlayer
}

export const updatePlayer = (player: Object3D, message: PositionPayload) => {
    const body: Body = player.userData.body
    body.position.copy(
        positionMessageToVec3(message.position)
    )
    body.quaternion.copy(
        rotationMessageToQuaternion(message.rotation)
    )
}

export const init = (canvas: HTMLCanvasElement) => {
    const {
        innerWidth: width,
        innerHeight: height
    } = window;

    // World
    world = new World({
        gravity: new Vec3(0, -10, 0),
        frictionGravity: new Vec3(0, .1, 0),
    })
    world.addContactMaterial(contactGroundPlayer)

    // Renderer
    renderer = new WebGLRenderer({ canvas });
    renderer.setSize(width, height);

    scene = new Scene();

    // Camera
    camera = new PerspectiveCamera(75, width / height, 0.1, 1000);
    scene.add(camera)

    // Light
    const light = new SpotLight(0xffffff, 1);
    light.position.set(0, 1, 0);
    scene.add(light);

    // Floor
    const floor = createPhysicsBox({
        position: new Vec3(0, -1, 0),
        rotation: new Quaternion(0, 0, 0, 1),
        size: new Vec3(100, 1, 100),
        mass: 0,
        renderMaterial: new MeshBasicMaterial({ color: 0x224422 }),
        physicsMaterial: groundMaterial
    });

    // Dummy
    const dummy = createPhysicsBox({
        position: new Vec3(0, 5, -5),
        rotation: new Quaternion(20, 40, 0, 1),
        size: new Vec3(1, 1, 1),
        mass: 1,
    });

    // Player
    player = createPhysicsBox({
        position: new Vec3(0, 1, 0),
        rotation: new Quaternion(0, 0, 0, 1),
        size: new Vec3(.5, .5, .5),
        mass: 10,
        renderMaterial: new MeshBasicMaterial({ color: 0x00ff00 }),
        physicsMaterial: playerMaterial
    });



    player.add(camera);
    camera.position.set(0, 2, 5);
    camera.rotation.set(-0.15, 0, 0);

    // Animate
    animate();
}