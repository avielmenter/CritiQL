import { Router, Request, Response, NextFunction } from 'express';
import { Connection } from 'mongoose';
import * as graphqlHTTP from 'express-graphql';

import * as Sheets from '../data/sheets';
import * as DB from '../data/schema/db';

import { CharacterDictionary } from '../data/schema/character';
import { EpisodeDictionary } from '../data/schema/episode';
import * as RequestLog from '../data/schema/request-log';

import { QuerySchema } from '../api/schema';
import { getEpisodeLoader, getCharacterLoader } from '../api/loaders';

let router = Router();

let dbConnection : Connection | null = null;

async function shouldSkipSpreadsheetRetrieval(con : Connection, req : Request) : Promise<boolean> {
	const secondsSinceLastLog = await RequestLog.secondsSinceLastLog(con);
	const shouldFetch = secondsSinceLastLog >= (process.env.CRITIQL_SHEETS_RATE_LIMIT || 600);

	await RequestLog.createLog(con, req.ip, shouldFetch);
	return !shouldFetch;
}

async function fillDB(con : Connection, req : Request) : Promise<number> {
	if (await shouldSkipSpreadsheetRetrieval(con, req))
		return 0;

	console.log('Retrieving spreadsheets...')

	const books = await Promise.all([
		Sheets.getSheetData(Sheets.api, Sheets.VM_SPREADSHEET_ID),
		Sheets.getSheetData(Sheets.api, Sheets.MN_SPREADSHEET_ID)
	]);

	if (!books || books.some(book => !book))
		return 0;

	console.log('Spreadsheets retrieved.');

	const rolls = await Promise.all(books.map(book => DB.fillFromBook(con, book as Sheets.Book)));
	return rolls.map(r => r.length).reduce((prev, curr) => prev + curr);
}

function fillDBHandler(req : Request, res : Response, next : NextFunction) {
	const con = DB.getConnection();
	
	fillDB(con, req)
		.then(rolls => console.log(rolls + " rolls added to database."))
		.catch(err => console.error(err));

	next();
}

function connectToDBHandler(req : any, res : Response, next : NextFunction) {
	req.dbConnection = DB.getConnection();

	if (!req.dbConnection)
		next(new Error("Could not connect to database."));
	else
		next();
}

router.get('/', fillDBHandler, connectToDBHandler, graphqlHTTP((req : any, res : Response) => ({
	schema: QuerySchema,
	graphiql: true,
	context: { 
		db: req.dbConnection,
		loaders: {
			episodes: getEpisodeLoader(req.dbConnection),
			characters: getCharacterLoader(req.dbConnection)
		}
	}
})));

router.post('/', connectToDBHandler, graphqlHTTP((req : any, res : Response) => ({
	schema: QuerySchema,
	graphiql: false,
	context: { 
		db: req.dbConnection,
		loaders: {
			episodes: getEpisodeLoader(req.dbConnection),
			characters: getCharacterLoader(req.dbConnection)
		}
	}
})))

export default router;