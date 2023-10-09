<script lang="ts">
	import * as mainScene from '$lib/world';
	import * as connection from '$lib/connection';
	import { onDestroy, onMount } from 'svelte';
	import { Vec3, type Body } from 'cannon-es';

	let canvas: HTMLCanvasElement;

	let baseForce = 100;
	let baseTorque = 10;
	
	let touchForceMultiplier = 1;
	let touchTorqueMultiplier = 1;

	let pressedKeys = new Set<string>();
	let intervalIdKeyboard: number;
	intervalIdKeyboard = setInterval(() => {
		if (!mainScene.player) return;
		const playerBody: Body = mainScene.player.userData.body;

		const currentForce = baseForce * (pressedKeys.has('shift') ? 2 : 1) * touchForceMultiplier;
		const currentTorque = baseTorque * (pressedKeys.has('shift') ? 0.25 : 1) * touchTorqueMultiplier;

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

	const dragThresholdX = 45;
	const dragThresholdY = 25;
	let touchStartEvent: TouchEvent | null = null;
	let didMove = false;
	const touchStart = (event: TouchEvent) => {
		touchStartEvent = event;
	};

	const touchMove = (event: TouchEvent) => {
		if (!touchStartEvent) return;

		const touchStart = touchStartEvent.touches[0];
		const touchCurrent = event.touches[0];

		const moveX = touchCurrent.screenX - touchStart.screenX;
		const moveY = touchCurrent.screenY - touchStart.screenY;

		if (moveX > dragThresholdX) {
			pressedKeys.delete('a');
			pressedKeys.add('d');
			didMove = true;
		} else if (moveX < -dragThresholdX) {
			pressedKeys.add('a');
			pressedKeys.delete('d');
			didMove = true;
		} else {
			pressedKeys.delete('a');
			pressedKeys.delete('d');
		}
		touchTorqueMultiplier = Math.min(1, 6 * (Math.abs(moveX) / window.innerWidth));

		if (moveY > dragThresholdY) {
			pressedKeys.delete('w');
			pressedKeys.add('s');
			didMove = true;
		} else if (moveY < -dragThresholdY) {
			pressedKeys.add('w');
			pressedKeys.delete('s');
			didMove = true;
		} else {
			pressedKeys.delete('w');
			pressedKeys.delete('s');
		}
		touchForceMultiplier = Math.min(1, 6 * (Math.abs(moveY) / window.innerHeight));
	};

	const touchEnd = (event: TouchEvent) => {
		if (!touchStartEvent) return;

		if (!didMove) {
			pressedKeys.add(' ');
			setTimeout(() => pressedKeys.delete(' '), 100);
		}

		didMove = false;
		pressedKeys.delete('w');
		pressedKeys.delete('a');
		pressedKeys.delete('s');
		pressedKeys.delete('d');

		touchStartEvent = null;
	};

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

<svelte:head>
	<title>sheeta.dog</title>
	<meta name="description" content="SHEETA DOT DOG" />
</svelte:head>

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
	on:touchstart={(event) => touchStart(event)}
	on:touchmove={(event) => touchMove(event)}
	on:touchend={(event) => touchEnd(event)}
	on:blur={() => pressedKeys.clear()}
	on:resize={() => {
		mainScene.camera.aspect = window.innerWidth / window.innerHeight;
		mainScene.camera.updateProjectionMatrix();
		mainScene.renderer.setSize(window.innerWidth, window.innerHeight);
	}}
/>

<canvas id="game" bind:this={canvas} />
<p id="instructions">press b to bark, press p to POOP</p>

<style lang="scss">
	#game {
		flex: 1;
	}

	#instructions {
		position: absolute;
		top: 0;
		left: 1em;
		z-index: 100;
		filter: invert(1);

		opacity: 0;
		animation: flash 1s 10;
	}

	@keyframes flash {
		0% {
			opacity: 0;
		}
		50% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
</style>
