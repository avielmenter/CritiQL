import { Router } from 'express';
import * as Sheets from '../data/sheets';
import * as ValueRange from '../data/value-range';
import * as SheetRange from '../data/sheet-range';

let router = Router();

async function getData() : Promise<string[][]> {
	const vm_sheet = await Sheets.getSheetData(Sheets.api, Sheets.VM_SPREADSHEET_ID);
	if (!vm_sheet)
		return [[]];

	const columns = vm_sheet.sheets['Episode 1'].cols;
	
	const header = [Object.keys(columns).sort((a, b) => columns[a] - columns[b])];
	const data = vm_sheet.sheets['Episode 1'].rows.map(row => Object.keys(columns).map(k => row[k]).sort((a, b) => columns[a] - columns[b]));

	const sheet = header.concat(data);

	console.log(JSON.stringify(vm_sheet.sheets['Episode 1'].rows.slice(0, 5), null, '\t'));

	return sheet;
}

router.get('/sheets', (req, res, next) => {
	/* Sheets.getSheetInfo(Sheets.sheets, Sheets.VM_SPREADSHEET_ID)
		.then(info => res.json(info))
		.catch(err => next(err)); */

	getData()
		.then(data => {
			const dataRowStrings = data.map((h : string[]) => h.map((s : string) => '<td>' + s + '</td>').reduce((prev : string, curr : string) => prev + curr));
			
			const dataString = 	'<!DOCTYPE html><html><body><table>' + 
									dataRowStrings.map((hr : string) => '<tr>' + hr + '</tr>')
									.reduce((prev : string, curr : string) => prev + curr) +
								'</table></body></html>';

			res.set('Content-Type', 'text/html');
			res.send(dataString);
		})
		.catch(err => next(err));
});

router.get('/', (req, res) => {
	res.send("API!");
});

export default router;