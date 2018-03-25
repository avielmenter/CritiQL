import { Router } from 'express';
import { Connection } from 'mongoose';

import * as Sheets from '../data/sheets';
import * as DB from '../data/schema/db';

let router = Router();

async function fillDB(con : Connection) : Promise<number> {
	const book = await Sheets.getSheetData(Sheets.api, Sheets.VM_SPREADSHEET_ID);
	if (!book)
		return 0;

	console.log('Retrieved spreadsheet.');

	const rolls = await DB.fillFromBook(con, book);
	return rolls.length;
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