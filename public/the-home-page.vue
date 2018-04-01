<template>
	<EpisodeStats episodeNo="11" />
</template>
<style scoped>

</style>
<script lang="ts">
	import Vue from 'vue';
	import { Component } from 'vue-property-decorator';
	import EpisodeStats from './components/episode-stats.vue';

	@Component({
		name: 'HomePage',
		components: {
			EpisodeStats: EpisodeStats
		}
	})
	export default class HomePage extends Vue {

	}
</script>