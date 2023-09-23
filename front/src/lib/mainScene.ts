import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer } from 'three';

export let renderer: WebGLRenderer;
export let camera: PerspectiveCamera;
export let scene: Scene;

let loop: boolean = true;

const animate = () => {
    if (!loop) return;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

export const init = (canvas: HTMLCanvasElement) => {
    renderer = new WebGLRenderer({ canvas });

    const {
        innerWidth: width,
        innerHeight: height
    } = window;

    renderer.setSize(width, height);

    camera = new PerspectiveCamera(75, width / height, 0.1, 1000);

    scene = new Scene();

    animate();
}