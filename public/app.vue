<template>
	<div id="app">
		<h1>&#9888; Front-End Coming Soon &#9888;</h1>
		<p>For now, please enjoy the <a href="/graphql">GraphQL API</a>.</p>
	</div>
</template>
<style>
	body {
		background: #E7E7E7;
	}

	#app {
		font-family: 'Helvetica', 'Arial', sans-serif;
		margin-top: 3em;
		text-align: center;
		margin-left: auto;
		margin-right: auto;
	}

	a {
		text-decoration: none;
		color: #0AF;
	}

	a:hover {
		text-decoration: underline;
	}
</style>

<script lang="ts">
	import Vue from 'vue';
	import { Component } from 'vue-property-decorator';
	
	@Component({
		name: 'App'
	})
	export default class App extends Vue {
		title : String;

		constructor() {
			super();
			this.title = 'CritiQL';
		}
	}
</script>