<template>
	<div class="episodeStats" v-if="episode.title">
		<h2>Stats for {{ episode.title }}</h2>
		<ul>
			<li><strong>Damage Dealt:</strong> {{ episode.damageRolls.totals ? episode.damageRolls.totals.sum : 'None' }}</li>
			<li><strong># of Natural 20s:</strong> {{ episode.critRolls.count || 'None'}}</li>
			<li><strong># of Natural 1s:</strong> {{ episode.critFails.count || 'None' }}</li>
			<li><strong>Best Character:</strong> Fjord</li>
		</ul>
	</div>
</template>
<style>

</style>
<script lang="ts">
	import Vue from 'vue';
	import axios,{ AxiosResponse } from 'axios';
	import { Component, Prop } from 'vue-property-decorator';

	@Component({})
	export default class EpisodeStats extends Vue {
		readonly graphQuery : string = `query episodeStats($episodeNo: Int!, $campaign: Int!) {
			episodes(episodeNo: $episodeNo, campaign: $campaign) {
				title
				damageRolls: rolls(rollType: DAMAGE) {
					totals {
						sum
					}
				}
				critRolls: rolls(natural: 20) {
					count
				}
				critFails: rolls(natural: 1) {
					count
				}
			}
		}`;

		@Prop({default: Infinity})
		episodeNo? : number;

		@Prop({default: 2})
		campaign? : 1 | 2;

		episode : any = {};

		data() {
			return { episode: {} };
		}

		created() {
			axios.post('/graphql', {
				query: this.graphQuery,
				variables: {
					episodeNo: this.episodeNo,
					campaign: this.campaign
				}
			})
			.then((response : AxiosResponse) => {
				this.episode = Object.assign({}, this.episode, response.data.data.episodes[0]);	
			})
		}
	}
</script>