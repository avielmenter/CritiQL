import * as GraphQL from 'graphql';
import { Connection } from 'mongoose';

import { RollsQLField } from './roll';

import * as Character from '../data/schema/character';

export const CharacterQLType : GraphQL.GraphQLObjectType = new GraphQL.GraphQLObjectType ({
	name: 'character',
	description: 'A character on Critical Role',

	fields: () => ({
		rolls: RollsQLField,
		id: {
			type: GraphQL.GraphQLID,
			resolve: (c : Character.Character) => c._id
		},
		name : { type: GraphQL.GraphQLString }
	})
});

export const CharactersQLField = {
	type: new GraphQL.GraphQLList(CharacterQLType),
	args: {
		id: { type: GraphQL.GraphQLID },
		name: { type: GraphQL.GraphQLString }
	},
	resolve: (obj : any, args : any, context : any) => {
		const con = context.db as Connection;
		return Character.findCharacters(con, args);
	}
}