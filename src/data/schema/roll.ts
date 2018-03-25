import * as mongoose from 'mongoose';

import { RowDictionary, COLUMNS, Book } from '../sheets';

import { Character, CharacterDictionary, sanitizeCharacterName } from './character';
import { Episode, EpisodeDictionary } from './episode';

import { ValueRange } from '../value-range';

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
	PERSUASION,
	ATTACK,
	TINKERING,
	THIEVES_TOOLS,
	DIVINE_INTERVENTION,
	DAMAGE
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
	natural : number | null,
	crit : boolean,
	damage : string | null,
	kills : number,
	notes : string | null
};

type Model = mongoose.Model<Roll>;

const schema : mongoose.Schema = new mongoose.Schema({
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
	damage : String,
	kills : Number,
	notes : String
});

function timeFromRow(row : RowDictionary) : ROLL_TIME | null {
	const timeString = row[COLUMNS.TIME];
	if (!timeString)
		return null;

	const parsed = timeString.trim().match(/(\d+):(\d+):(\d+)/i);
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

function getRollType(typeString : string) : ROLL_TYPE {
	if (!typeString)
		return ROLL_TYPE.UNKNOWN;

	const formatted = typeString.replace('\'', '')
								.replace(/\s+/i, ' ')
								.replace(' ', '_')
								.toUpperCase();

	const maybeRollType : ROLL_TYPE | undefined = (<any>ROLL_TYPE)[formatted];
	if (!maybeRollType)
		return ROLL_TYPE.UNKNOWN;
	return maybeRollType;
}

function isCrit(critStr : string) : boolean {
	if(!critStr)
		return false;

	return critStr.trim().toLowerCase().charAt(0) == 'y';
}

function sanitizeNaturalRoll(natStr : string) : number | null {
	if (!natStr)
		return null;

	const rollInt = parseInt(natStr.toLowerCase().replace('natural', '').replace('nat', '').trim());
	return !rollInt ? null : rollInt;
}

function sanitizeInt(totalStr : string) : number | null {
	if (!totalStr || !parseInt(totalStr))
		return null;

	return parseInt(totalStr);
}

function getRollDocument(character : Character, episode : Episode, row : RowDictionary) : any {
	const rollTime = timeFromRow(row);
	const rollType = getRollType(row[COLUMNS.TYPE_OF_ROLL]);

	return {
		episode_id: episode._id,
		character_id: character._id,
		time: rollTime,
		type_of_roll: rollType,
		total: sanitizeInt(row[COLUMNS.TOTAL_VALUE]),
		natural: sanitizeNaturalRoll(row[COLUMNS.NATURAL_VALUE]),
		crit: isCrit(row[COLUMNS.CRIT]),
		damage: row[COLUMNS.DAMAGE],
		kills: sanitizeInt(row[COLUMNS.KILLS]) || 0,
		notes: row[COLUMNS.NOTES]
	};
}

function getModel(con : mongoose.Connection) : Model {
	return con.model('Roll', schema);
}

export async function clearEpisodeRolls(con : mongoose.Connection, episode : Episode) : Promise<Episode> {
	const model = getModel(con);
	await model.remove({ episode_id: episode._id });

	return episode.update({ $set: { rollsInDB: false } }, { new: true });
}

export async function createFromSheetRow(con : mongoose.Connection, character : Character, episode : Episode, row : RowDictionary) : Promise<Roll> {
	const rollDoc = getRollDocument(character, episode, row);
	const model = getModel(con);

	return await model.create(rollDoc);
}

export async function createFromBook(con : mongoose.Connection, book : Book, characters : CharacterDictionary, episodes : EpisodeDictionary) : Promise<Roll[]> {
	const rollDocs = Object.keys(book.sheets).map(title => {
		const sheet = book.sheets[title];
		const episode = episodes[title];

		if (episode.rollsInDB)
			return []; // skip episodes whose rolls are already in the database

		return sheet.rows.map(row => {
			const characterName = sanitizeCharacterName(row[COLUMNS.CHARACTER]);
			const character = characters[characterName];

			return getRollDocument(character, episode, row);
		});
	}).reduce((prev, curr) => prev.concat(curr));

	const model = getModel(con);

	const rolls = await model.insertMany(rollDocs);
	await Promise.all(Object.keys(episodes).map(title => episodes[title].update({ $set: { rollsInDB: true } }, { new: true })));

	return rolls;
}