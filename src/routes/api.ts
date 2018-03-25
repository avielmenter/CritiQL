import { Router } from 'express';
import { Connection } from 'mongoose';

import * as Sheets from '../data/sheets';
import * as DB from '../data/schema/db';

let router = Router();

async function fillDB(con : Connection) : Promise<number> {
	const books = await Promise.all([
		Sheets.getSheetData(Sheets.api, Sheets.VM_SPREADSHEET_ID),
		Sheets.getSheetData(Sheets.api, Sheets.MN_SPREADSHEET_ID)
	]);

	if (!books || books.some(book => !book))
		return 0;

	console.log('Retrieved spreadsheets.');

	const rolls = await Promise.all(books.map(book => DB.fillFromBook(con, book as Sheets.Book)));
	return rolls.map(r => r.length).reduce((prev, curr) => prev + curr);
}

router.get('/', (req, res, next) => {
	const con = DB.getConnection();
	fillDB(con).then(results => {
		con.close();
		res.send(results + ' rolls inserted.');
	})
	.catch(err => {
		con.close();
		next(err);
	});
});

export default router;