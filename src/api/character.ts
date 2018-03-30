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

async function createCharactersQLEnum(con : Connection) {
	let valuesDict : { [characterName : string] : { value : string } } = {};
	const characters = await Character.findCharacters(con, {});

	characters.sort((a, b) => a.name < b.name ? -1 : (a.name > b.name ? 1 : 0))
	.forEach(c => {
		const sanitized = c.name.trim()
								.replace('\'', '')
								.replace(' ', '_')
								.replace('ä', 'a'); // dammit Shakästa

		valuesDict[sanitized] = { value: c.name };
	});

	return valuesDict;
}

async function getCharactersQLEnum(con : Connection) {
	const values = await createCharactersQLEnum(con);

	return new GraphQL.GraphQLEnumType({
		name: 'characterName',
		description: 'Which character made the roll?',

		values: values
	});
}

export async function getCharactersQLField(con : Connection) {
	const charEnumType = await getCharactersQLEnum(con);
	
	return {
		type: new GraphQL.GraphQLList(CharacterQLType),
		args: {
			id: { type: GraphQL.GraphQLID },
			name: { type: charEnumType }
		},
		resolve: (obj : any, args : any, context : any) => {
			const con = context.db as Connection;
			return Character.findCharacters(con, args);
		}
	}
}