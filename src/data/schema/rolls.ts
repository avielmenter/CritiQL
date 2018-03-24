import * as mongoose from 'mongoose';

import { RowDictionary } from '../sheets';

import { Character } from './character';
import { Episode } from './episode';

import { ValueRange } from '../value-range';

const COLUMNS : { [name : string] : string } = {
	EPISODE: 'Episode',
	TIME: 'Time',
	CHARACTER: 'Character',
	TYPE_OF_ROLL: 'Type of Roll',
	TOTAL_VALUE: 'Total Value',
	NATURAL_VALUE: 'Natural Value',
	CRIT: 'Crit?',
	DAMAGE: 'Damage',
	KILLS: '# Kills',
	NOTES: 'Notes'
};

export enum ROLL_TYPE {
	UNKNOWN,
	OTHER,
	STRENGTH,
	STRENGTH_SAVE,
	ATHLETICS,
	DEXTERITY,
	DEXTERITY_SAVE,
	ACROBATICS,
	SLEIGHT_OF_HAND,
	STEALTH,
	INITIATIVE,
	CONSTITUTION,
	CONSTITUTION_SAVE,
	INTELLIGENCE,
	INTELLIGENCE_SAVE,
	ARCANA,
	HISTORY,
	INVESTIGATION,
	NATURE,
	RELIGION,
	WISDOM,
	WISDOM_SAVE,
	ANIMAL_HANDLING,
	INSIGHT,
	MEDICINE,
	PERCEPTION,
	SURVIVAL,
	CHARISMA,
	CHARISMA_SAVE,
	DECEPTION,
	INTIMIDATION,
	PERFORMANCE,
	PERSUASION
};

export type SKILL_TYPE = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
export type SKILL_RANGE = { 
	$gte : ROLL_TYPE,
	$lt : ROLL_TYPE
}

export type ROLL_TIME = {
	hours : number,
	minutes : number,
	seconds : number
}

export const SKILLS : { [key in SKILL_TYPE] : SKILL_RANGE } = {
	STR: {
		$gte: ROLL_TYPE.STRENGTH,
		$lt: ROLL_TYPE.DEXTERITY
	},
	DEX: {
		$gte: ROLL_TYPE.DEXTERITY,
		$lt: ROLL_TYPE.CONSTITUTION
	},
	CON: {
		$gte: ROLL_TYPE.CONSTITUTION,
		$lt: ROLL_TYPE.INSIGHT
	},
	INT: {
		$gte: ROLL_TYPE.INTELLIGENCE,
		$lt: ROLL_TYPE.WISDOM
	},
	WIS: {
		$gte: ROLL_TYPE.WISDOM,
		$lt: ROLL_TYPE.CHARISMA
	},
	CHA: {
		$gte: ROLL_TYPE.CHARISMA,
		$lt: ROLL_TYPE.PERSUASION + 1
	}
};

export interface Roll extends mongoose.Document {
	episode_id : string,
	character_id : string,
	time : ROLL_TIME | null,
	type_of_roll : ROLL_TYPE,
	total : number,
	natural : number,
	crit : boolean,
	damage : number,
	kills : number,
	notes : string
};

export type Model = mongoose.Model<Roll>;

export const schema : mongoose.Schema = new mongoose.Schema({
	episode_id : String,
	character_id : String,
	time : {
		hours : Number,
		minutes : Number,
		seconds : Number
	},
	type_of_roll : Number,
	total : Number,
	natural : Number,
	crit : Boolean,
	damage : Number,
	kills : Number,
	notes : String
});

export function getModel(con : mongoose.Connection) : Model {
	return con.model('Roll', schema);
}

function timeFromRow(row : RowDictionary) : ROLL_TIME | null {
	const timeString = row.TIME;

	const parsed = timeString.match(/(\d+):(\d+):(\d+)/i);
	if (!parsed || parsed.length != 4)
		return null;

	const timeNums = parsed.map(p => parseInt(p));
	if (timeNums.slice(1).some(tn => tn === NaN))
		return null;

	return {
		hours: timeNums[1],
		minutes: timeNums[2],
		seconds: timeNums[3]
	};
}

export async function createFromSheetRow(con : mongoose.Connection, character : Character, episode : Episode, row : RowDictionary) : Promise<Roll> {
	const rollTime = timeFromRow(row);
	const rollType : ROLL_TYPE = ROLL_TYPE.OTHER; // TODO: parse roll type

	const rollDoc = {
		episode_id: episode._id,
		character_id: character._id,
		time: rollTime,
		type_of_roll: rollType,
		total: row[COLUMNS.TOTAL_VALUE],
		natural: row[COLUMNS.NATURAL_VALUE],
		crit: row[COLUMNS.CRIT],
		damage: row[COLUMNS.DAMAGE],
		kills: row[COLUMNS.KILLS],
		notes: row[COLUMNS.NOTES]
	};

	const model = getModel(con);

	return await model.create(rollDoc);
}