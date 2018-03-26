import * as GraphQL from 'graphql';
import { Connection } from 'mongoose';

import { EpisodeQLType } from './episode';
import { CharacterQLType } from './character';

import * as Roll from '../data/schema/roll';
import * as Episode from '../data/schema/episode';
import * as Character from '../data/schema/character';

function createRollQLTypeEnum() {
	let valuesDict : { [typeName : string] : { value : number }} = {};

	Object.keys(Roll.ROLL_TYPE).forEach(rt => {
		if (!parseInt(rt) && rt != "0")
			valuesDict[rt] = { value: parseInt(Roll.ROLL_TYPE[rt as any]) };
	});

	return valuesDict;
}

const RollTimeQLType = new GraphQL.GraphQLObjectType({
	name: 'time',
	description: 'What time did the roll take place? formattted as hh:mm:ss',

	fields: () => ({
		hours: {
			type: GraphQL.GraphQLInt,
			resolve: (t : Roll.RollTime) => t.hours
		},
		minutes: { 
			type: GraphQL.GraphQLInt,
			resolve: (t : Roll.RollTime) => t.seconds
		},
		seconds: {
			type: GraphQL.GraphQLInt,
			resolve: (t : Roll.RollTime) => t.seconds
		}
	})
});

const RollTypeQLEnum = new GraphQL.GraphQLEnumType({
	name: 'rollType',
	description: 'What type of roll was it?',

	values: createRollQLTypeEnum()
})

export const RollQLType = new GraphQL.GraphQLObjectType({
	name: 'roll',
	description: 'A roll made, usually with a d20',

	fields: () => ({
		id: {
			type: GraphQL.GraphQLID,
			resolve: (r : Roll.Roll) => r._id
		},
		episode: {
			type: EpisodeQLType,
			resolve: (r : Roll.Roll, args, context) => Episode.getEpisodeById(context.db, r.episode_id) 
		},
		character: { 
			type: CharacterQLType, 
			resolve: (r : Roll.Roll, args, context) => Character.getCharacterById(context.db, r.character_id)
		},
		time: { type: RollTimeQLType },
		rollType: { 
			type: GraphQL.GraphQLString,
			resolve: (r : Roll.Roll) => Roll.ROLL_TYPE[r.type_of_roll]
		},
		total: { type: GraphQL.GraphQLInt },
		natural: { type: GraphQL.GraphQLInt },
		crit: { type: GraphQL.GraphQLBoolean },
		damage: { type: GraphQL.GraphQLString },
		kills: { type: GraphQL.GraphQLInt },
		notes: { type: GraphQL.GraphQLString }
	})
});

export const RollsQLField = {
	type: new GraphQL.GraphQLList(RollQLType),
	args: { 
		id: { type: GraphQL.GraphQLID },
		rollType: { type: RollTypeQLEnum },
		naturalValue: { type: GraphQL.GraphQLInt },
		naturalAtLeast: { type: GraphQL.GraphQLInt },
		naturalAtMost: { type: GraphQL.GraphQLInt },
		totalValue: { type: GraphQL.GraphQLInt },
		totalAtLeast: { type: GraphQL.GraphQLInt },
		totalAtMost: { type: GraphQL.GraphQLInt }
	},
	resolve: (obj : any, args : any, context : any) => {
		const con = context.db as Connection;
		return Roll.findRolls(con, args, obj);
	}
}