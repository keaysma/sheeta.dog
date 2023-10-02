<script lang="ts">
	import * as mainScene from '$lib/world';
	import * as connection from '$lib/connection';
	import { onDestroy, onMount } from 'svelte';
	import { Vec3, type Body } from 'cannon-es';

	let canvas: HTMLCanvasElement;

	let baseForce = 100;
	let baseTorque = 10;

	let pressedKeys = new Set<string>();
	let intervalIdKeyboard: number;
	intervalIdKeyboard = setInterval(() => {
		if (!mainScene.player) return;
		const playerBody: Body = mainScene.player.userData.body;

		const currentForce = baseForce * (pressedKeys.has('shift') ? 2 : 1);
		const currentTorque = baseTorque * (pressedKeys.has('shift') ? 0.25 : 1);

		if (pressedKeys.has('w')) {
			playerBody.applyLocalForce(new Vec3(0, 0, -currentForce), new Vec3(0, 0, 0));
			// playerBody.applyLocalImpulse(new Vec3(0, 0, -1), new Vec3(0, 0, -1));
			// playerBody.velocity.z = -10
		}

		if (pressedKeys.has('a')) {
			playerBody.applyTorque(new Vec3(0, currentTorque, 0));
		}

		if (pressedKeys.has('s')) {
			playerBody.applyLocalForce(new Vec3(0, 0, currentForce), new Vec3(0, 0, 1));
		}

		if (pressedKeys.has('d')) {
			playerBody.applyTorque(new Vec3(0, -currentTorque, 0));
		}

		if (pressedKeys.has(' ') && mainScene.player.userData.canJump) {
			playerBody.applyLocalForce(new Vec3(0, 150 * baseForce, 0), new Vec3(0, 0, 0));
			mainScene.player.userData.canJump = false;
		}

		// if (pressedKeys.has('z')){
		// 	playerBody.quaternion.setFromEuler(0, 0, 0)
		// 	mainScene.player.userData.canJump = true;
		// }
	}, 1);

	onMount(async () => {
		mainScene.init(canvas);
		connection.init();
		
		const name = new URLSearchParams(window.location.search).get('name');
		if (name === '__physics_test') {
			(async () => {
				await new Promise((resolve) => setTimeout(resolve, 2000));

				pressedKeys.add('w');
				// await new Promise((resolve) => setTimeout(resolve, 3000));
				await new Promise((resolve) => setTimeout(resolve, 1000));

				pressedKeys.delete('w');
				// await new Promise((resolve) => setTimeout(resolve, 3000));

				// pressedKeys.add('a');
				// await new Promise((resolve) => setTimeout(resolve, 500));

				// pressedKeys.delete('a');
				// await new Promise((resolve) => setTimeout(resolve, 2000));

				// pressedKeys.add('s');
				// pressedKeys.add('d');
				// await new Promise((resolve) => setTimeout(resolve, 1000));

				// pressedKeys.delete('d');
				// await new Promise((resolve) => setTimeout(resolve, 3000));
				// pressedKeys.delete('s');
			})();
		}
	});

	onDestroy(() => {
		clearInterval(intervalIdKeyboard);
		connection.terminateServer();
		mainScene.renderer?.dispose();
	});
</script>

<svelte:window
	on:keydown={(event) => {
		if (event.key === 'b') {
			connection.woof();
		} else if (event.key === 'p') {
			connection.poop();
		} else {
			pressedKeys.add(event.key.toLowerCase());
		}
	}}
	on:keyup={(event) => pressedKeys.delete(event.key.toLowerCase())}
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
