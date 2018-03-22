<template>
	<div id="app">
		Hello, Vue!
	</div>
</template>
<script lang="ts">
	import Vue from 'vue';
	import { Component } from 'vue-property-decorator';

	@Component({})
	export default class App extends Vue {
		title : String;

		constructor() {
			super();
			this.title = 'CritiQL';

			console.log("test?");
		}
	}
</script>