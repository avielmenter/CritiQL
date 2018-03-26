import * as GraphQL from 'graphql';

import { getEpisodeById } from '../data/schema/episode'
import { getCharacterById } from '../data/schema/character';

import { EpisodesQLField } from './episode';
import { RollsQLField } from './roll';
import { CharactersQLField } from './character';

const QueryType = new GraphQL.GraphQLObjectType({
	name: 'query',
	description: 'Query rolls, episodes, or characters in Critical Role',

	fields: () => ({
		episodes: EpisodesQLField,
		rolls: RollsQLField,
		characters: CharactersQLField
	})
})

export const QuerySchema = new GraphQL.GraphQLSchema({
	query: QueryType
});