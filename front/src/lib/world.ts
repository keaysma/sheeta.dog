import { Body, Box, Quaternion, Vec3, World, Material as CannonMaterial, ContactMaterial, Shape, Plane, GSSolver } from 'cannon-es';
import { EntityType, type PhysicsData } from '../types/shared';
import { BoxGeometry, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, Scene, SpotLight, Vector3, Quaternion as ThreeQuaternion, WebGLRenderer, Material, BufferGeometry, CubeTextureLoader, TextureLoader, RepeatWrapping, PlaneGeometry, Euler, DirectionalLight, HemisphereLight, MeshLambertMaterial, PCFSoftShadowMap, CameraHelper, VSMShadowMap, PCFShadowMap, Group, AudioListener, AudioLoader, PositionalAudio } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';

let shadows = false

export let renderer: WebGLRenderer;
export let camera: PerspectiveCamera;
export let scene: Scene;
export let player: Object3D;
export let listener: AudioListener;

let world: World
const groundMaterial = new CannonMaterial({ friction: 1, restitution: 0 })
const playerMaterial = new CannonMaterial({ friction: 1, restitution: 0 })
const contactGroundPlayer = new ContactMaterial(groundMaterial, playerMaterial, {
    friction: 0,
    restitution: 0,
})

let playerModel: Promise<Object3D>

let pooModel: Promise<Object3D>

let loop: boolean = true;

const positionMessageToVec3 = (position: PhysicsData['position']): Vec3 =>
    new Vec3(position.x, position.y, position.z)

const rotationMessageToQuaternion = (rotation: PhysicsData['rotation']): Quaternion =>
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

export const addAudioToObject = (object: Object3D, audioFilePath: string) => {
    const sound = new PositionalAudio(listener);
    sound.setRefDistance(0.2)
    object.add(sound);

    const audioLoader = new AudioLoader();
    audioLoader.load(audioFilePath, (buffer) => {
        sound.setBuffer(buffer);
        sound.setRefDistance(20);
        sound.play();
    });
}

export const addPhysicsBodyToMesh = ({
    base,
    position,
    rotation,
    mass,
    colliders,
    physicsMaterial

}: {
    base: Object3D,
    position: Vec3,
    rotation: Quaternion,
    mass: number,
    colliders: (
        [Shape] | [Shape, Vec3, Quaternion]
    )[],
    physicsMaterial?: CannonMaterial
}) => {
    const body = new Body({
        mass,
        position,
        quaternion: rotation,
        material: physicsMaterial,
    })
    body.linearDamping = 0.99
    body.angularDamping = 0.99

    body.linearFactor.set(1, 1, 1)
    body.angularFactor.set(0, 1, 0)

    colliders.forEach(([shape, offset, rotation]) => body.addShape(shape, offset, rotation))
    world.addBody(body)
    base.userData.body = body
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
    const meshMaterial = renderMaterial ?? new MeshBasicMaterial({ color: 0xff0000 })
    const base = new Mesh(geometry, meshMaterial)
    base.position.copy(translateVector3(position))
    base.quaternion.copy(translateQuaternion(rotation))

    if (shadows) {
        base.receiveShadow = false
        base.castShadow = true
    }

    scene.add(base)

    addPhysicsBodyToMesh({
        base,
        position,
        rotation,
        mass,
        colliders,
        physicsMaterial
    })

    return base
}

export const createPhysicsBox = ({
    position,
    rotation,
    size,
    mass,
    colliders,
    renderMaterial,
    physicsMaterial
}: {
    position: Vec3,
    rotation: Quaternion,
    size: Vec3,
    mass: number,
    renderMaterial?: Material,
    colliders?: (
        [Shape] | [Shape, Vec3, Quaternion]
    )[]
    physicsMaterial?: CannonMaterial
}) => {
    return createPhysicsMesh({
        geometry: new BoxGeometry(size.x * 2, size.y * 2, size.z * 2),
        position,
        rotation,
        renderMaterial,
        mass,
        colliders: colliders ?? [
            [new Box(size)]
        ],
        physicsMaterial,
    })
}

export const addPoo = (id: string, message: PhysicsData) => {
    const base = new Object3D()
    pooModel.then((model) => base.add(model.clone()))

    const loader = new FontLoader();

    loader.load('assets/papyrus.json', function (font) {

        const textGeometry = new TextGeometry(id, {
            font: font,
            size: 80,
            height: 5,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 10,
            bevelSize: 8,
            bevelOffset: 0,
            bevelSegments: 5
        });

        const textMaterial = new MeshLambertMaterial({ color: 0xffffff })
        const text = new Mesh(textGeometry, textMaterial)
        text.position.set(-5, 5, 0)
        text.scale.setScalar(0.04)
        base.add(text)
    });

    base.scale.setScalar(0.15)
    base.name = id
    scene.add(base)

    const position = positionMessageToVec3(message.position)
    const rotation = rotationMessageToQuaternion(message.rotation)
    // addPhysicsBodyToMesh
    base.position.copy(
        translateVector3(position)
    )
    base.quaternion.copy(
        translateQuaternion(rotation)
    )

    base.userData.type = EntityType.Poo

    return base
}

export const addPlayer = (id: string, message: PhysicsData) => {
    const floorDetector = new Box(new Vec3(.1, .1, .1))
    floorDetector.collisionResponse = false

    const base = new Object3D();
    playerModel.then((model) => base.add(model.clone()))

    base.scale.setScalar(.15)
    base.name = id;
    scene.add(base)

    const position = positionMessageToVec3(message.position)
    const rotation = rotationMessageToQuaternion(message.rotation)
    addPhysicsBodyToMesh({
        base,
        position,
        rotation,
        colliders: [
            [new Box(new Vec3(.25, .45, .5))],
            [floorDetector, new Vec3(0, -.45, 0), new Quaternion()]
        ],
        mass: 10,
    })

    base.userData.type = EntityType.Dog
    base.userData.canJump = true
    base.userData.body.addEventListener('collide', () => {
        base.userData.canJump = true
    })
    base.userData.body.addEventListener('collideEnd', () => {
        base.userData.canJump = false
    })

    return base
}

export const updateEntity = (entity: Object3D, message: PhysicsData) => {
    const position = positionMessageToVec3(message.position)
    const rotation = rotationMessageToQuaternion(message.rotation)
    switch (entity.userData.type) {
        case EntityType.Dog:
            const body: Body = entity.userData.body
            body.position.copy(position)
            body.quaternion.copy(rotation)
            break;
        case EntityType.Poo:
            entity.position.copy(translateVector3(position))
            entity.quaternion.copy(translateQuaternion(rotation))
            break;
        default:
            console.log('Unknown entity type', entity.userData.type)
            break;
    }

}

export const upsertEntity = (id: string, entityType: EntityType, message: PhysicsData) => {
    console.log('upserting', id, entityType, message)
    const existingEntity = scene.getObjectByName(id);
    if (existingEntity) {
        updateEntity(existingEntity, message);
    } else {
        switch (entityType) {
            case EntityType.Dog:
                addPlayer(id, message)
                break;
            case EntityType.Poo:
                addPoo(id, message)
                break;
            default:
                console.log('Unknown entity type', entityType)
                break;
        }
    }
}

export const init = (canvas: HTMLCanvasElement) => {
    playerModel = (() => {
        const playerModelLoader = new GLTFLoader()
        return new Promise<Object3D>((res) => {
            playerModelLoader.load('assets/frenchie.glb', (model) => {
                model.scene.traverse(
                    function (child: Object3D | Mesh) {
                        if ('isMesh' in child && child.isMesh) {
                            child.material = new MeshLambertMaterial({ color: 0xdd00ff })
                            child.castShadow = shadows
                            child.receiveShadow = shadows
                        }
                    }
                )
                res(model.scene)
            })
        })
    })()

    pooModel = (() => {
        const pooModelLoader = new GLTFLoader()
        return new Promise<Object3D>((res) => {
            pooModelLoader.load('assets/poo.gltf', (model) => {
                model.scene.traverse(
                    function (child: Object3D | Mesh) {
                        if ('isMesh' in child && child.isMesh) {
                            child.material = new MeshLambertMaterial({ color: 0xffe600 })
                            child.castShadow = shadows
                            child.receiveShadow = shadows
                        }
                    }
                )
                model.scene.rotation.setFromVector3(new Vector3(-Math.PI / 2, 0, 0))
                model.scene.position.set(0, -3, 0)
                res(model.scene)
            })
        })
    })()

    const {
        innerWidth: width,
        innerHeight: height
    } = window;

    // World
    world = new World({
        gravity: new Vec3(0, -30, 0),
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

    renderer.shadowMap.enabled = shadows
    renderer.shadowMap.type = PCFSoftShadowMap

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
    const hemiLight = new HemisphereLight(0xffffff, 0xffffff, 0.9);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const light = new DirectionalLight(0xffffff, 1);

    light.position.set(100, 100, 0);
    light.target.position.set(-10, -20, 0);

    light.castShadow = shadows

    if (shadows) {
        const side = 50;
        light.shadow.camera.top = side;
        light.shadow.camera.bottom = -side;
        light.shadow.camera.left = side;
        light.shadow.camera.right = -side;

        const mapSize = 512 * 10
        light.shadow.mapSize.set(mapSize, mapSize);
    }

    scene.add(light);

    // Shadow debugger
    // const shadowHelper = new CameraHelper(light.shadow.camera);
    // scene.add(shadowHelper);

    // Floor
    const floorTexture = new TextureLoader().load('assets/grass.jpg')
    floorTexture.wrapS = floorTexture.wrapT = RepeatWrapping
    floorTexture.repeat.set(10, 10)
    const floor = createPhysicsMesh({
        geometry: new PlaneGeometry(100, 100),
        position: new Vec3(0, 0, 0),
        rotation: new Quaternion().setFromEuler(-Math.PI / 2, 0, 0),
        renderMaterial: new MeshLambertMaterial({ map: floorTexture }),
        mass: 0,
        physicsMaterial: groundMaterial,
        colliders: [
            [new Plane()]
        ],
    })
    floor.receiveShadow = true

    // Couch
    const couchLoader = new GLTFLoader()
    const couchTexture = new TextureLoader().load('assets/Sofa202_Diffuse.jpg')
    couchLoader.load('assets/Sofa202.gltf', (gltf) => {
        gltf.scene.scale.set(5, 5, 5)
        gltf.scene.traverse(
            function (child: Object3D | Mesh) {
                if ('isMesh' in child && child.isMesh) {
                    child.material = new MeshLambertMaterial({ map: couchTexture })
                    child.castShadow = shadows
                    child.receiveShadow = shadows
                }
            }
        )

        const colliders = [
            [new Box(new Vec3(4.415, 1.35, 1.475)), new Vec3(), new Quaternion()],
            [new Box(new Vec3(.115, 2.15, 1.475)), new Vec3(4, 0, 0), new Quaternion()],
            [new Box(new Vec3(.115, 2.15, 1.475)), new Vec3(-4, 0, 0), new Quaternion()],
            [new Box(new Vec3(4.415, 2.15, .275)), new Vec3(0, 0, -1.2), new Quaternion()],
        ] as [Box, Vec3, Quaternion][]

        const setsPositionRotation = [
            {
                position: new Vec3(0, 0, -15),
                rotation: new Quaternion().setFromEuler(0, 270, 0)
            },
            {
                position: new Vec3(0, 0, 15),
                rotation: new Quaternion().setFromEuler(0, 22, 0)
            }
        ]
        setsPositionRotation.forEach(({ position, rotation }) => {
            const base = gltf.scene.clone()
            addPhysicsBodyToMesh({
                base,
                position,
                rotation,
                colliders,
                mass: 0,
                physicsMaterial: groundMaterial,
            })
            scene.add(base)
        })
    })

    // Player
    player = addPlayer('', {
        position: new Vec3(0, 5, 0),
        rotation: new Quaternion().setFromEuler(0, 0, 0),
    })

    // Player Camera
    player.add(camera);
    camera.position.set(0, 10, 20);
    camera.rotation.set(-0.15, 0, 0);

    // Player Audio
    listener = new AudioListener();
    camera.add(listener);

    // Animate
    animate();
}