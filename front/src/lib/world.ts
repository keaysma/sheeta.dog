import { Body, Box, Quaternion, Vec3, World, Material as CannonMaterial, ContactMaterial, Shape, Plane, GSSolver } from 'cannon-es';
import type { PositionPayload } from '../types/shared';
import { BoxGeometry, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, Scene, SpotLight, Vector3, Quaternion as ThreeQuaternion, WebGLRenderer, Material, BufferGeometry, CubeTextureLoader, TextureLoader, RepeatWrapping, PlaneGeometry, Euler } from 'three';

export let renderer: WebGLRenderer;
export let camera: PerspectiveCamera;
export let scene: Scene;
export let player: Object3D;

let world: World
const groundMaterial = new CannonMaterial({ friction: 1, restitution: 0 })
const playerMaterial = new CannonMaterial({ friction: 1, restitution: 0 })
const contactGroundPlayer = new ContactMaterial(groundMaterial, playerMaterial, {
    friction: 0,
    restitution: 0,
})

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
            [Shape] | [Shape, Vec3, Quaternion]
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
    body.linearDamping = 0.99
    body.angularDamping = 0.99
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
        size: new Vec3(.5, .5, .5),
        mass: 10,
        renderMaterial: new MeshBasicMaterial({ color: 0x00ff00 }),
        physicsMaterial: playerMaterial,
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
        gravity: new Vec3(0, -20, 0),
        frictionGravity: new Vec3(0, -.01, 0),
    })
    world.defaultContactMaterial.contactEquationStiffness = 1e9
    world.defaultContactMaterial.contactEquationRelaxation = 4

    const solver = new GSSolver()
    solver.iterations = 7
    solver.tolerance = 0.1
    world.solver = solver

    world.addContactMaterial(contactGroundPlayer)

    // Renderer
    renderer = new WebGLRenderer({ canvas });
    renderer.setSize(width, height);

    // Scene
    scene = new Scene();

    // Skybox
    scene.background = new CubeTextureLoader().setPath('assets/sky/bluecloud_').load([
        'ft.jpg',
        'bk.jpg',
        'up.jpg',
        'dn.jpg',
        'rt.jpg',
        'lf.jpg',
    ])

    // Camera
    camera = new PerspectiveCamera(75, width / height, 0.1, 1000);
    scene.add(camera)

    // Light
    const light = new SpotLight(0xffffff, 1);
    light.position.set(0, 1, 0);
    scene.add(light);

    // Floor
    const floorTexture = new TextureLoader().load('assets/grass.jpg')
    floorTexture.wrapS = floorTexture.wrapT = RepeatWrapping
    floorTexture.repeat.set(8, 8)
    //*/
    createPhysicsMesh({
        geometry: new PlaneGeometry(100, 100),
        position: new Vec3(0, 0, 0),
        rotation: new Quaternion().setFromEuler(-Math.PI / 2, 0, 0),
        renderMaterial: new MeshBasicMaterial({ map: floorTexture }),
        mass: 0,
        physicsMaterial: groundMaterial,
        colliders: [
            [new Plane()]
        ],
    })
    /*/
    createPhysicsBox({
        position: new Vec3(0, -1, 0),
        rotation: new Quaternion(0, 0, 0, 1),
        size: new Vec3(100, 1, 100),
        mass: 0,
        renderMaterial: new MeshBasicMaterial({ map: floorTexture }),
        physicsMaterial: groundMaterial
    })
    /*/

    // Dummy
    // createPhysicsBox({
    //     position: new Vec3(0, 5, -5),
    //     rotation: new Quaternion().setFromEuler(20, 40, 0),
    //     size: new Vec3(1, 1, 1),
    //     mass: 1,
    //     physicsMaterial: playerMaterial,
    // });

    // Player
    player = addPlayer('', {
        position: new Vec3(0, 5, 0),
        rotation: new Quaternion().setFromEuler(0, 0, 0),
    });



    player.add(camera);
    camera.position.set(0, 2, 5);
    camera.rotation.set(-0.15, 0, 0);

    // Animate
    animate();
}