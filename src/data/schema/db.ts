import * as mongoose from 'mongoose';

import { api, Book, COLUMNS, getSheetData, MN_SPREADSHEET_ID, VM_SPREADSHEET_ID } from '../sheets';
import * as Episode from './episode';
import * as Character from './character';
import * as Roll from './roll';
import * as RequestLog from './request-log';

var CONNECTION : mongoose.Connection | null = null;

function getConnectionString() {
	const dbAuth = (process.env.CRITIQL_DB_USER === undefined || process.env.CRITIQL_DB_USER == '') ? 
					'' : (process.env.CRITIQL_DB_USER + ':' + process.env.CRITIQL_DB_PASSWORD + '@');

	const conStr = 'mongodb://' + dbAuth + process.env.CRITIQL_DB_SERVER + ':' + process.env.CRITIQL_DB_PORT + '/' +
					process.env.CRITIQL_DB_SCHEMA + 
					(!process.env.CRITIQL_DB_OPTIONS ? '' : '?' + process.env.CRITIQL_DB_OPTIONS);

	return conStr;
}

export function getConnection() : mongoose.Connection {
	if (!CONNECTION) {
		CONNECTION = mongoose.createConnection(getConnectionString());
		console.log("New MongoDB connection opened.");
	}

	return CONNECTION;
}

export async function closeConnection() : Promise<void> {
	if (CONNECTION != null)
		await CONNECTION.close();
}

export async function useTemporaryConnection<T>(use : (_con : mongoose.Connection) => Promise<T>) : Promise<T> {
	const con = mongoose.createConnection(getConnectionString());
	
	try {
		return await use(con);
	} catch (err) {
		throw err;
	} finally {
		if (con)
			con.close();
	}
}

function getCampaignNumber(spreadsheetId : string) : number {
	return spreadsheetId == VM_SPREADSHEET_ID ? 1 : 2;
}

export async function getEpisodes(con : mongoose.Connection, book : Book) : Promise<Episode.EpisodeDictionary> {
	const campaign = getCampaignNumber(book.info.spreadsheetId);
	let episodes : Episode.EpisodeDictionary = {};

	const episodePromises = Object.keys(book.sheets).map(title => Episode.createFromSheet(con, book.sheets[title].info, campaign));
	(await Promise.all(episodePromises)).forEach(episode => {
		episodes[episode.title] = episode;
	});
		
	return episodes;
}

function getCharacterNames(sheet : Book) : string[] {
	let characterNames : string[] = [];

	for (const episodeTitle of Object.keys(sheet.sheets)) {
		const episodeSheet = sheet.sheets[episodeTitle];
		for (const row of episodeSheet.rows) {
			if (!characterNames.includes(row[COLUMNS.CHARACTER]))
				characterNames.push(row[COLUMNS.CHARACTER]);
		}
	}

	return characterNames;
}

export async function getCharacters(con : mongoose.Connection, book : Book) : Promise<Character.CharacterDictionary> {
	let characters : Character.CharacterDictionary = {};

	const characterNames = getCharacterNames(book);
	const characterPromises = characterNames.map(name => Character.createCharacter(con, name));
	(await Promise.all(characterPromises)).forEach(character => {
		if (character != null)
			characters[character.name] = character;
	});

	return characters;
}

export async function fillFromBook(con : mongoose.Connection, book : Book) : Promise<Roll.Roll[]> {
	const episodes = await getEpisodes(con, book);
	const characters = await getCharacters(con, book);

	console.log("Inserting rolls...");

	return await Roll.createFromBook(con, book, characters, episodes);
}

async function shouldSkipSpreadsheetRetrieval(con : mongoose.Connection, ip : string) : Promise<boolean> {
	const secondsSinceLastLog = await RequestLog.secondsSinceLastLog(con);
	const shouldFetch = secondsSinceLastLog >= (process.env.CRITIQL_SHEETS_RATE_LIMIT || 600);

	await RequestLog.createLog(con, ip, shouldFetch);
	return !shouldFetch;
}

export async function fillDB(con : mongoose.Connection, ip : string) : Promise<number> {
	if (await shouldSkipSpreadsheetRetrieval(con, ip))
		return 0;

	console.log('Retrieving spreadsheets...')

	const books = await Promise.all([
		getSheetData(api, VM_SPREADSHEET_ID),
		getSheetData(api, MN_SPREADSHEET_ID)
	]);

	if (!books || books.some(book => !book))
		return 0;

	console.log('Spreadsheets retrieved.');

	const rolls = await Promise.all(books.map(book => fillFromBook(con, book as Book)));
	return rolls.map(r => r.length).reduce((prev, curr) => prev + curr);
}