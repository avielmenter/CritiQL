import * as GraphQL from 'graphql';
import { Connection } from 'mongoose';

import { RollsQLField } from './roll';
import * as Episode from '../data/schema/episode';

export const EpisodeQLType : GraphQL.GraphQLObjectType = new GraphQL.GraphQLObjectType({
	name: 'episode',
	description: 'A campaign episode of Critical Role',

	fields: () => ({
		rolls: RollsQLField,
		id: {
			type: GraphQL.GraphQLID,
			resolve: (e : Episode.Episode, args, context) => {
				if (!context.cache.episodes[e._id])
					context.cache.episodes[e._id] = e;
				return e._id;
			}
		},
		campaign: { type: GraphQL.GraphQLInt },
		episodeNo: { type: GraphQL.GraphQLInt },
		title: { type: GraphQL.GraphQLString }
	})
})

export const EpisodesQLField = {
	type: new GraphQL.GraphQLList(EpisodeQLType),
	args: { 
		id: { type: GraphQL.GraphQLID },
		campaign: { type: GraphQL.GraphQLInt },
		episodeNo: { type: GraphQL.GraphQLInt },
		title: { type: GraphQL.GraphQLString },
		episodeAtLeast: { type: GraphQL.GraphQLInt },
		episodeAtMost: { type: GraphQL.GraphQLInt }
	},
	resolve: (obj : any, args : any, context : any) => {
		const con = context.db as Connection;
		return Episode.findEpisodes(con, args);
	}
}