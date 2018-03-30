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

function createSkillQLTypeEnum() {
	let valuesDict : { [typeName : string] : { value : string } } = {};
	for (let key in Roll.SKILLS) {
		valuesDict[key] = { value: key };
	}

	return valuesDict;
}

function getTimeString(time : Roll.RollTime | null) {
	if (!time)
		return '';

	return time.hours.toString() + ':' + time.minutes.toString().padStart(2, '0') + ':' + time.seconds.toString().padStart(2, '0');
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
			resolve: (t : Roll.RollTime) => t.minutes
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
});

const SkillQLEnum = new GraphQL.GraphQLEnumType({
	name: 'skillType',
	description: 'What skill did the roll use?',

	values: createSkillQLTypeEnum()
});

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
			resolve: (r : Roll.Roll, args, context) => context.loaders.episodes.load(r.episode_id) 
		},
		character: { 
			type: CharacterQLType, 
			resolve: (r : Roll.Roll, args, context) => context.loaders.characters.load(r.character_id)
		},
		time: { type: RollTimeQLType },
		timeString : {
			type: GraphQL.GraphQLString,
			resolve: (r : Roll.Roll) => !r.time ? '' : getTimeString(r.time)
		},
		rollType: { 
			type: GraphQL.GraphQLString,
			resolve: (r : Roll.Roll) => Roll.ROLL_TYPE[r.type_of_roll]
		},
		rawRollType: {
			type: GraphQL.GraphQLString,
			resolve: (r : Roll.Roll) => r.roll_type_raw
		},
		total: { type: GraphQL.GraphQLInt },
		natural: { type: GraphQL.GraphQLInt },
		crit: { type: GraphQL.GraphQLBoolean },
		damage: { type: GraphQL.GraphQLString },
		kills: { type: GraphQL.GraphQLInt },
		notes: { type: GraphQL.GraphQLString }
	})
});

export const RollsAggregateType = new GraphQL.GraphQLObjectType({
	name: 'aggregate',
	description: 'Aggregate data (sum, average, minimum, and maximum) for a list of rolls',

	fields: () => ({
		count: { type: GraphQL.GraphQLInt },
		sum: { type: GraphQL.GraphQLInt },
		avg: { type: GraphQL.GraphQLFloat },
		min: { type: GraphQL.GraphQLInt },
		max: { type: GraphQL.GraphQLInt }
	})
})

function aggregateGenerator (fieldName : Roll.AGGREGATE_FIELDS) : (obj : any, args : any, context : any) => Promise<Roll.RollAggregate | null> {
	return (filter, args, context) => Roll.aggregateField(context.db as Connection, fieldName, filter.args, filter.obj);
}

export const RollsQLType = new GraphQL.GraphQLObjectType({
	name: 'rolls',
	description: 'A list of rolls made',

	fields: () => ({
		list: {
			type: new GraphQL.GraphQLList(RollQLType),
			resolve: (filter : any, args : any, context : any) => {
				const con = context.db as Connection;
				return Roll.findRolls(con, filter.args, filter.obj);
			}
		},
		count: {
			type: GraphQL.GraphQLInt,
			resolve: (filter, args, context) => Roll.count(context.db as Connection, filter.args, filter.obj)
		},
		totals: {
			type: RollsAggregateType,
			resolve: aggregateGenerator('total')
		},
		naturals: {
			type: RollsAggregateType,
			resolve: aggregateGenerator('natural')
		},
		damages: {
			type: RollsAggregateType,
			resolve: aggregateGenerator('damage')
		},
		kills: { 
			type: RollsAggregateType,
			resolve: aggregateGenerator('kills')
		}
	})
});

export const RollsQLField = {
	type: RollsQLType,
	args: { 
		id: { type: GraphQL.GraphQLID },
		rollType: { type: RollTypeQLEnum },
		skill: { type: SkillQLEnum },
		natural: { type: GraphQL.GraphQLInt },
		naturalAtLeast: { type: GraphQL.GraphQLInt },
		naturalAtMost: { type: GraphQL.GraphQLInt },
		total: { type: GraphQL.GraphQLInt },
		totalAtLeast: { type: GraphQL.GraphQLInt },
		totalAtMost: { type: GraphQL.GraphQLInt },
		limit: { type: GraphQL.GraphQLInt }
	},
	resolve: (obj : any, args : any, context : any) => { 
		return { obj: obj, args: args, context: context }
	}
}