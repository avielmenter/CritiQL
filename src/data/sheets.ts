import { google } from 'googleapis';

import * as SheetRange from './sheet-range';
import * as ValueRange from './value-range';
import { promisify } from 'util';

type GoogleAPICallback = (err : any, response : any) => void;
type GoogleAPICall = (params : any, callback : GoogleAPICallback) => void;

type IndexDictionary = { [column : string] : number };
export type RowDictionary = { [column : string] : string };

export interface SheetInfo {
	properties : {
		sheetId : number,
		title : string,
		index : number,
		gridProperties : {
			rowCount : number,
			columnCount : number
		}
	},
	merges? : [{
		sheetId : number,
		startRowIndex : number,
		endRowIndex : number,
		startColumnIndex : number,
		endColumnIndex : number
	}]
}

export interface Sheet {
	info : SheetInfo,
	rows : RowDictionary[],
	cols : IndexDictionary
}

export interface Info {
	spreadsheetId : string,
	properties : {
		title : string
	},
	sheets : SheetInfo[]
};

export interface Book {
	info : Info,
	sheets : { [sheetName : string]: Sheet }
}

export const api = google.sheets('v4');
export const VM_SPREADSHEET_ID = '1OEg29XbL_YpO0m5JrLQpOPYTnxVsIg8iP67EYUrtRJg';
export const MN_SPREADSHEET_ID = '1FFuw5c6Hk1NUlHv2Wvr5b9AElLA51KtRl9ZruPU8r9k';

export enum COLUMNS {
	EPISODE = 'Episode',
	TIME = 'Time',
	CHARACTER = 'Character',
	TYPE_OF_ROLL = 'Type of Roll',
	TOTAL_VALUE = 'Total Value',
	NATURAL_VALUE = 'Natural Value',
	CRIT = 'Crit?',
	DAMAGE = 'Damage',
	KILLS = '# Kills',
	NOTES = 'Notes'
};

function promisifyAPICall(apiCall : GoogleAPICall, params : any) : Promise<any> {
	return new Promise<any>((resolve : (r : any) => any, reject : (e : any) => any) => {
		apiCall(params, (err : any, response : any) => {
			if (err)
				reject(err);
			else
				resolve(response);
		});
	});
}

async function getValues(sheetsAPI : any, spreadsheetId : string, range : SheetRange.SheetRange) : Promise<ValueRange.ValueRange | null> {
	const params = {
		auth: process.env.CRITIQL_SHEETS_KEY,
		range: SheetRange.rangeToString(range),
		spreadsheetId: spreadsheetId,
		valueRenderOption: 'FORMATTED_VALUE'
	};

	const response = await promisifyAPICall(sheetsAPI.spreadsheets.values.get, params);
	return ValueRange.ValueRange(response.data);
}

async function batchGetValues(sheetsAPI : any, spreadsheetId : string, ranges : SheetRange.SheetRange[]) : Promise<ValueRange.ValueRanges | null> {
	const params = {
		auth: process.env.CRITIQL_SHEETS_KEY,
		ranges: ranges.map(sr => SheetRange.rangeToString(sr)),
		spreadsheetId: spreadsheetId,
		valueRenderOption: 'FORMATTED_VALUE'
	};

	const response = await promisifyAPICall(sheetsAPI.spreadsheets.values.batchGet, params);
	return ValueRange.ValueRanges(response.data);
}

async function getSheetInfo(sheetsAPI : any, spreadsheetId : string) : Promise<Info | null> {
	const params = {
		auth: process.env.CRITIQL_SHEETS_KEY,
		spreadsheetId: spreadsheetId,
		includeGridData: false,
	};

	const response = await promisifyAPICall(sheetsAPI.spreadsheets.get, params);
	
	if (!response.data) return null;

	try {
		return response.data as Info;
	} catch (e) {
		return null;
	}
}

function getHeaderRange(sheet : SheetInfo) : SheetRange.SheetRange {
	const headerRowRange = "'" + sheet.properties.title + "'!A1:" + 
		SheetRange.numberToColumnName(sheet.properties.gridProperties.columnCount) + "1";

	return SheetRange.SheetRange(headerRowRange) as SheetRange.SheetRange;
}

function getColumnIndices(headerVR : ValueRange.ValueRange) : IndexDictionary {
	let columns : IndexDictionary = {};

	if (!headerVR || !headerVR.values || headerVR.values.length != 1 || !headerVR.values[0])
		return {};

	const header : string[] = headerVR.values[0];

	for (let i = 0; i < header.length; i++) {
		const colName = header[i] == 'Damage Dealt' ? 'Damage' : header[i];
		if (!colName)
			continue;
		
		columns[colName] = (colName in columns) ? Math.min(columns[colName], i) : i;
	}

	return columns;
}

function getRowDictionary(row : string[], indices : IndexDictionary) : RowDictionary {
	let dict : RowDictionary = {};

	for (let column of Object.keys(indices)) {
		dict[column] = row[indices[column]];
	}

	return dict;
}

async function getSheetHeaders(sheetsAPI : any, info : Info) : Promise<ValueRange.ValueRanges | null> {
	const headerRanges = info.sheets.map(si => getHeaderRange(si));
	return batchGetValues(sheetsAPI, info.spreadsheetId, headerRanges);
}

async function getSheetColumns(sheetsAPI : any, info : Info) : Promise<{ [sheetName : string]: IndexDictionary }> {
	let sheetHeaders : { [sheetName : string]: IndexDictionary } = {};

	const headers = await getSheetHeaders(sheetsAPI, info);
	if (!headers)
		return sheetHeaders;
	
	for (let h of headers.valueRanges) {
		if (h.range.sheet)
			sheetHeaders[h.range.sheet] = getColumnIndices(h);
	}

	return sheetHeaders;
}

function getDataRange(info : SheetInfo) : SheetRange.SheetRange {
	const startCell : SheetRange.SheetCell = {
		column: 1,
		row: 2
	};

	const endCell : SheetRange.SheetCell = {
		column: info.properties.gridProperties.columnCount,
		row: info.properties.gridProperties.rowCount
	};

	return {
		sheet: info.properties.title,
		startCell: startCell,
		endCell: endCell
	};
}

export async function getSheetData(sheetsAPI : any, spreadsheetId : string) : Promise<Book | null> {
	const info = await getSheetInfo(sheetsAPI, spreadsheetId);
	if (!info)
		return null;

	const columns = await getSheetColumns(sheetsAPI, info);
	const dataRanges = info.sheets.map(sheet => getDataRange(sheet));

	const sheetData = await batchGetValues(sheetsAPI, info.spreadsheetId, dataRanges);
	if (!sheetData)
		return null;

	let sheets : { [sheetName : string] : Sheet } = {};
	
	for (let sheet of info.sheets) {
		sheets[sheet.properties.title] = {
			info: sheet,
			cols: columns[sheet.properties.title],
			rows: []
		}
	}

	sheetData.valueRanges.forEach(vr => {
		if (!vr.range.sheet)
			return;

		let sheet = sheets[vr.range.sheet];
		sheets[vr.range.sheet].rows = vr.values.map(row => getRowDictionary(row, sheet.cols));
	});

	return {
		info: info,
		sheets: sheets
	};
}