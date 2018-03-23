import { google } from 'googleapis';

import * as SheetRange from './sheet-range';
import * as ValueRange from './value-range';

export type GoogleAPICallback = (err : any, response : any) => void;
export type GoogleAPICall = (params : any, callback : GoogleAPICallback) => void;

export const sheets = google.sheets('v4');
export const CRITROLESTATS_SPREADSHEET = '1OEg29XbL_YpO0m5JrLQpOPYTnxVsIg8iP67EYUrtRJg';

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

export async function get(sheetsAPI : any, spreadsheetID : string, range : SheetRange.SheetRange) : Promise<any> {
	const params = {
		auth: process.env.CRITIQL_SHEETS_KEY,
		range: SheetRange.rangeToString(range),
		spreadsheetId: spreadsheetID,
		valueRenderOption: 'FORMATTED_VALUE'
	};

	const response = await promisifyAPICall(sheets.spreadsheets.values.get, params);
	return ValueRange.ValueRanges(response.data);
}

export async function batchGet(sheetsAPI : any, spreadsheetID : string, ranges : SheetRange.SheetRange[]) : Promise<any> {
	const params = {
		auth: process.env.CRITIQL_SHEETS_KEY,
		ranges: ranges.map(sr => SheetRange.rangeToString(sr)),
		spreadsheetId: spreadsheetID,
		valueRenderOption: 'FORMATTED_VALUE'
	};

	const response = await promisifyAPICall(sheets.spreadsheets.values.batchGet, params);
	return ValueRange.ValueRanges(response.data);
}