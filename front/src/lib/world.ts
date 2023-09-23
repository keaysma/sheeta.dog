import type { PositionPayload } from '../types/shared';
import { BoxGeometry, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, Scene, SpotLight, WebGLRenderer } from 'three';

export let renderer: WebGLRenderer;
export let camera: PerspectiveCamera;
export let scene: Scene;
export let player: Object3D;

let loop: boolean = true;

const animate = () => {
    if (!loop) return;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

export const addPlayer = (id: string, message: PositionPayload) => {
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    const newPlayer = new Mesh(geometry, material);
    newPlayer.position.set(message.position.x, message.position.y, message.position.z);
    newPlayer.rotation.set(
        message.rotation.x,
        message.rotation.y,
        message.rotation.z,
        message.rotation.order
    );
    newPlayer.name = id;
    scene.add(newPlayer);
}

export const updatePlayer = (playerObject: Object3D, message: PositionPayload) => {
    playerObject.position.set(message.position.x, message.position.y, message.position.z);
    playerObject.rotation.set(
        message.rotation.x,
        message.rotation.y,
        message.rotation.z,
        message.rotation.order
    );
}

export const init = (canvas: HTMLCanvasElement) => {
    const {
        innerWidth: width,
        innerHeight: height
    } = window;

    renderer = new WebGLRenderer({ canvas });
    renderer.setSize(width, height);

    scene = new Scene();

    // Camera
    camera = new PerspectiveCamera(75, width / height, 0.1, 1000);
    scene.add(camera)

    // Animate
    animate();

    // Floor
    const floor = new Mesh(
        new BoxGeometry(50, 0.1, 50),
        new MeshBasicMaterial({ color: 0x004f00 })
    );
    floor.position.y = -1;
    scene.add(floor);

    // Light
    const light = new SpotLight(0xffffff, 1);
    light.position.set(0, 1, 0);
    scene.add(light);

    // Dummy
    const dummy = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: 0xff0000 }));
    dummy.position.x = 2;
    scene.add(dummy);

    // Player
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    player = new Mesh(geometry, material);
    scene.add(player);

    
    player.add(camera);
    camera.position.set(0, 2, 5);
    camera.rotation.set(-0.15, 0, 0);
}