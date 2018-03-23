import { Router } from 'express';
import * as Sheets from '../data/sheets';
import * as SheetRange from '../data/sheet-range';

let router = Router();

router.get('/sheets', (req, res, next) => {
	const qRanges : string[] = req.query.range.split(',');
	const dodgyRanges = qRanges.map(sr => SheetRange.SheetRange(sr));

	for (let i = 0; i < dodgyRanges.length; i++) {
		const r = dodgyRanges[i];

		if (!r) {
			next(new Error("Invalid range entered: " + qRanges[i]));
			return;
		}
	}

	const ranges : SheetRange.SheetRange[] = dodgyRanges.filter((r):r is SheetRange.SheetRange => r != null);

	Sheets.batchGet(Sheets.sheets, Sheets.CRITROLESTATS_SPREADSHEET, ranges)
		.then(vr => {
			res.json(vr);
		})
		.catch(err => {
			next(err);
		});
});

router.get('/', (req, res) => {
	res.send("API!");
});

export default router;