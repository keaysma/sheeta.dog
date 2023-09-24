<script lang="ts">
	import * as mainScene from '$lib/world';
	import * as connection from '$lib/connection';
	import { onDestroy, onMount } from 'svelte';
	import { ClientMessageType, type ClientPositionMessage } from '../../types/client';
	import { Vec3, type Body } from 'cannon-es';

	let canvas: HTMLCanvasElement;

	let currentForce = 80;
	let currentTorque = 60;

	let pressedKeys = new Set<string>();
	let intervalIdKeyboard: number;
	intervalIdKeyboard = setInterval(() => {
		const playerBody: Body = mainScene.player.userData.body;

		if (pressedKeys.has('w')) {
			playerBody.applyLocalForce(new Vec3(0, 0, -currentTorque), new Vec3(0, 0, 0));
		}

		if (pressedKeys.has('a')) {
			playerBody.applyTorque(new Vec3(0, currentForce, 0))
		}

		if (pressedKeys.has('s')) {
			playerBody.applyLocalForce(new Vec3(0, 0, currentTorque), new Vec3(0, 0, 0));
		}

		if (pressedKeys.has('d')) {
			playerBody.applyTorque(new Vec3(0, -currentForce, 0))
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
