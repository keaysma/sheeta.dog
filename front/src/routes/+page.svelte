<svelte:head>
	<title>sheeta.dog</title>
	<meta name="description" content="SHEETA DOT DOG" />
</svelte:head>

<section id="home">
	<h1>Woof.&nbsp;</h1>
	<form method="get" action="game">
		<fieldset>
			<label for="name">Woof?</label><br/>
			<input required id="name" name="name" placeholder="sheeta" />
		</fieldset>

		<button type="submit">woof!&nbsp;→</button>
	</form>
</section>

<style lang="scss">
	#home {
		padding: 2em 4em;

		> h1 {
			text-decoration: underline;
			font-size: 4em;
		}

		> form {
			display: flex;
			flex-direction: column;

			input {
				padding: 0.5em;
			}

			button[type="submit"] {
				width: 8em;
				height: 2em;

				margin: 0.125em;
				margin-top: 2em;

				border: none;
				border-radius: 0.5em;
			}
		}
	}
</style>
