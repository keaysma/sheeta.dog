<script lang="ts">
	import * as mainScene from '$lib/world';
	import * as connection from '$lib/connection';
	import { onDestroy, onMount } from 'svelte';
	import { ClientMessageType, type ClientPositionMessage } from '../../types/client';

	let canvas: HTMLCanvasElement;

	let currentSpeed = 0.1;
	let currentRotationSpeed = 0.01;

	let pressedKeys = new Set<string>();
	let intervalIdKeyboard: number;
	intervalIdKeyboard = setInterval(() => {
		let updated = false;

		if (pressedKeys.has('w')) {
			mainScene.player.translateZ(-currentSpeed);
			updated = true;
		}

		if (pressedKeys.has('a')) {
			mainScene.player.rotation.y += currentRotationSpeed;
			updated = true;
		}

		if (pressedKeys.has('s')) {
			mainScene.player.translateZ(currentSpeed);
			updated = true;
		}

		if (pressedKeys.has('d')) {
			mainScene.player.rotation.y -= currentRotationSpeed;
			updated = true;
		}

		if (pressedKeys.has('q')) {
			mainScene.player.translateX(-currentSpeed);
			updated = true;
		}

		if (pressedKeys.has('e')) {
			mainScene.player.translateX(currentSpeed);
			updated = true;
		}

		if (updated) {
			const message: ClientPositionMessage = {
				type: ClientMessageType.Position,
				position: mainScene.player.position,
				rotation: {
					x: mainScene.player.rotation.x,
					y: mainScene.player.rotation.y,
					z: mainScene.player.rotation.z,
					order: mainScene.player.rotation.order
				}
			};
			connection.server.send(JSON.stringify(message));
		}
	}, 10);

	onMount(() => {
		mainScene.init(canvas);
		connection.init();
	});

	onDestroy(() => {
		clearInterval(intervalIdKeyboard);
        connection.terminateServer();
        mainScene.renderer?.dispose();
	});
</script>

<svelte:window
	on:keydown={(event) => pressedKeys.add(event.key)}
	on:keyup={(event) => pressedKeys.delete(event.key)}
	on:blur={() => pressedKeys.clear()}
	on:resize={() => {
		mainScene.camera.aspect = window.innerWidth / window.innerHeight;
		mainScene.camera.updateProjectionMatrix();
		mainScene.renderer.setSize(window.innerWidth, window.innerHeight);
	}}
/>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<canvas bind:this={canvas} />

<style lang="scss">
	canvas {
		flex: 1;
	}
</style>
