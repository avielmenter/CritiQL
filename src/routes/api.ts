import { Router, Request, Response, NextFunction } from 'express';
import { Connection } from 'mongoose';
import * as graphqlHTTP from 'express-graphql';

import * as Sheets from '../data/sheets';
import * as DB from '../data/schema/db';

import { CharacterDictionary } from '../data/schema/character';
import { EpisodeDictionary } from '../data/schema/episode';
import * as RequestLog from '../data/schema/request-log';

import { QuerySchema } from '../api/schema';

let router = Router();

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

router.get('/', fillDBHandler, graphqlHTTP({
	schema: QuerySchema,
	graphiql: true,
	context: { db: DB.getConnection() }
}));

router.post('/', graphqlHTTP({
	schema: QuerySchema,
	graphiql: false,
	context: { 
		db: DB.getConnection(),
		cache: {
			characters: {} as CharacterDictionary,
			episodes: {} as EpisodeDictionary
		}
	}
}))

export default router;