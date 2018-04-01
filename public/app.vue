<template>
	<div id="app">
		<header>
			<div class="width-container">
				<img id="logo" src="/images/logo.png" /> 
				<h1>Criti<span style="color: #E535AB">QL</span></h1>
			</div>
		</header>
		<nav>
			<div class="width-container">
				<div style="float: left;">
					<router-link to="/home">HOME</router-link>
					<router-link to="/characters">CHARACTERS</router-link>
					<router-link to="/episodes">EPISODES</router-link>
					<router-link to="/rolls">ROLLS</router-link>
				</div>
				<div style="float: right;">
					<a href="/graphql" style="color: #E535AB">API</a>
					<a href="https://critrolestats.com" style="color: #89AEE3">CRITROLESTATS</a>
				</div>
			</div>
		</nav>
		<!-- 
		<h1>&#9888; Front-End Coming Soon &#9888;</h1>
		<p>For now, please enjoy the <a href="/graphql">GraphQL API</a>.</p>
		-->
		<main>
			<router-view></router-view>
		</main>
	</div>
</template>
<style>
	body {
		background: #E7E7E7;
		padding: 0;
		margin: 0;
	}

	.width-container {
		max-width: 1024px;
		margin-left: auto;
		margin-right: auto;
	}

	#app {
		font-family: 'Helvetica', 'Arial', sans-serif;
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

	header {
		padding-top: 12pt;
		text-align: left;
		background: #E7E7E7;
	}

	header h1 {
		font-size: 48pt;
		display: inline;
	}

	header .width-container {
		display: flex;
		align-items: center;
		line-height: 24pt;
	}
	
	nav {
		background: #222;
		height: 36pt;
	}

	nav a {
		color: white;
		font-size: 16pt;
		margin-top: 11pt;
		display: inline-block;
		padding-left: 1em;
		padding-right: 1em;
		font-weight: bold;
	}

	img#logo {
		height: 48pt;
		padding-bottom: 10pt;
	}
</style>

<script lang="ts">
	import Vue from 'vue';
	import VueRouter from 'vue-router';
	import { Component } from 'vue-property-decorator';

	import HomePage from './the-home-page.vue';

	Vue.use(VueRouter);

	const router = new VueRouter({
		mode: 'history',
		routes: [
			{ path: '/home', name: 'home', component: HomePage },
			{ path: '/characters', name: 'characters', component: {  } },
			{ path: '/episodes', name: 'episodes', component: {  } },
			{ path: '/rolls', name: 'rolls', component: { } }
		]
	});

	@Component({
		name: 'App',
		router: router
	})
	export default class App extends Vue {
		title : String;

		constructor() {
			super();
			this.title = 'CritiQL';
		}
	}
</script>