<script lang="ts">
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section id="home">
	<h1>Woof</h1>
	<form method="get" action="game">
		<fieldset>
			<label for="name">Woof?</label>
			<input id="name" name="name" placeholder="sheeta" />
		</fieldset>

		<button type="submit">woof!</button>
	</form>
</section>

<style lang="scss">
	#home {
		padding: 2em 4em;

		> form {
			display: flex;
			flex-direction: column;

			width: 12em;
			gap: 2em;

			button {
				border: none;
			}
		}
	}
</style>
