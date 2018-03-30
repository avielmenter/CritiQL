import * as GraphQL from 'graphql';
import { Connection } from 'mongoose';

import { getEpisodeById } from '../data/schema/episode'
import { getCharacterById } from '../data/schema/character';

import { EpisodesQLField } from './episode';
import { RollsQLField } from './roll';
import { getCharactersQLField } from './character';

export async function getQueryType(con : Connection) : Promise<GraphQL.GraphQLObjectType> {
	const charactersField = await getCharactersQLField(con);

	return new GraphQL.GraphQLObjectType({
		name: 'query',
		description: 'Query rolls, episodes, or characters in Critical Role',

		fields: () => ({
			episodes: EpisodesQLField,
			rolls: RollsQLField,
			characters: charactersField
		})
	});
}

export async function getQuerySchema(con : Connection) : Promise<GraphQL.GraphQLSchema> {
	return new GraphQL.GraphQLSchema({
		query: await getQueryType(con)
	});
}