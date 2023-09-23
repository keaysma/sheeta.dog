<script lang="ts">
	import * as mainScene from '$lib/mainScene';
	import { onDestroy, onMount } from 'svelte';
	import { BoxGeometry, Mesh, MeshBasicMaterial, Object3D, SpotLight } from 'three';
	import { ServerMessageType, type ServerMessage } from '../types/server';
	import type { PositionPayload } from '../types/shared';
	import { ClientMessageType, type ClientPingMessage, type ClientPositionMessage } from '../types/client';

	let server: WebSocket;
	let intervalIdPing: number;
	intervalIdPing = setInterval(() => {
		if(server?.readyState === server.OPEN){
			const message: ClientPingMessage = {
				type: ClientMessageType.Ping
			}
			server.send(JSON.stringify(message))
		}
	}, 5000)
	onDestroy(() => clearInterval(intervalIdPing))

	let canvas: HTMLCanvasElement;

	let currentSpeed = 0.1;
	let currentRotationSpeed = 0.01;

	let controlledObject: Object3D;
	let pressedKeys = new Set<string>();
	let intervalIdKeyboard: number;
	intervalIdKeyboard = setInterval(() => {
		let updated = false;

		if (pressedKeys.has('w')) {
			controlledObject.translateZ(-currentSpeed);
			updated = true;
		}

		if (pressedKeys.has('a')) {
			controlledObject.rotation.y += currentRotationSpeed;
			updated = true;
		}

		if (pressedKeys.has('s')) {
			controlledObject.translateZ(currentSpeed);
			updated = true;
		}

		if (pressedKeys.has('d')) {
			controlledObject.rotation.y -= currentRotationSpeed;
			updated = true;
		}

		if (pressedKeys.has('q')) {
			controlledObject.translateX(-currentSpeed);
			updated = true;
		}

		if (pressedKeys.has('e')) {
			controlledObject.translateX(currentSpeed);
			updated = true;
		}

		if (updated) {
			const message: ClientPositionMessage = {
				type: ClientMessageType.Position,
				position: controlledObject.position,
				rotation: {
					x: controlledObject.rotation.x,
					y: controlledObject.rotation.y,
					z: controlledObject.rotation.z,
					order: controlledObject.rotation.order
				}
			};
			server.send(JSON.stringify(message));
		}
	}, 10);
	onDestroy(() => clearInterval(intervalIdKeyboard))

	function updatePlayer(playerObject: Object3D, message: PositionPayload) {
		playerObject.position.set(message.position.x, message.position.y, message.position.z);
		playerObject.rotation.set(
			message.rotation.x,
			message.rotation.y,
			message.rotation.z,
			message.rotation.order
		);
	}

	function addPlayer(id: string, message: PositionPayload) {
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
		mainScene.scene.add(newPlayer);
	}

	function onMessage(message: MessageEvent<string>) {
		const data: ServerMessage = JSON.parse(message.data);

		if (data.type !== ServerMessageType.Update) console.log(data);

		switch (data.type) {
			case ServerMessageType.Identify:
				controlledObject.name = data.id;
				Object.entries(data.worldState).forEach(([id, message]) => {
					if (id === controlledObject.name) {
						updatePlayer(controlledObject, message);
					} else {
						addPlayer(id, message);
					}
				});
				break;
			case ServerMessageType.Joined:
				const existingPlayer = mainScene.scene.getObjectByName(data.id);
				if (existingPlayer) {
					updatePlayer(existingPlayer, data.message);
				} else {
					addPlayer(data.id, data.message);
				}
				break;
			case ServerMessageType.Update:
				if (data.id === controlledObject.name) {
					break;
				}

				const updatee = mainScene.scene.getObjectByName(data.id);
				if (updatee) {
					updatePlayer(updatee, data.message);
				}
				// else {
				// 	addPlayer(data.id, data.message);
				// }
				break;
			case ServerMessageType.Left:
				const leavingPlayer = mainScene.scene.getObjectByName(data.id);
				if (leavingPlayer) {
					mainScene.scene.remove(leavingPlayer);
				}
				break;
		}
	}

	onMount(() => {
		mainScene.init(canvas);
		mainScene.camera.position.z = 5;

		// Floor
		const floor = new Mesh(
			new BoxGeometry(50, 0.1, 50),
			new MeshBasicMaterial({ color: 0x004f00 })
		);
		floor.position.y = -1;
		mainScene.scene.add(floor);

		// Light
		const light = new SpotLight(0xffffff, 1);
		light.position.set(0, 1, 0);
		mainScene.scene.add(light);

		// Dummy
		const dummy = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: 0xff0000 }));
		dummy.position.x = 2;
		mainScene.scene.add(dummy);

		// Player
		const geometry = new BoxGeometry(1, 1, 1);
		const material = new MeshBasicMaterial({ color: 0x00ff00 });
		const player = new Mesh(geometry, material);
		mainScene.scene.add(player);

		controlledObject = player;

		controlledObject.add(mainScene.camera);
		mainScene.camera.position.set(0, 2, 5);
		mainScene.camera.rotation.set(-0.15, 0, 0);

		server = new WebSocket('ws://192.168.0.102:3000');
		server.onmessage = onMessage;
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

<section>
	<canvas bind:this={canvas} />
</section>

<style lang="scss">
	section {
		flex: 1;

		> canvas {
			width: 100%;
			height: 100%;
		}
	}
</style>
