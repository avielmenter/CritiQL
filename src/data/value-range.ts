import * as SheetRange from './sheet-range';

export type Dimension = "ROWS" | "COLUMNS" | "DIMENSION_UNSPECIFIED";

export interface ValueRange {
	range : SheetRange.SheetRange,
	majorDimension : Dimension,
	values : string[][]
}

export interface ValueRanges {
	spreadsheetId : string,
	valueRanges : ValueRange[]
}

export function ValueRange(obj : any) : ValueRange | null {
	if (!obj) 
		return null;

	const sr = SheetRange.SheetRange(obj.range);

	if (!sr || !obj.values)
		return null;

	const values : string[][] = obj.values;
	const dim : Dimension = obj.majorDimension == "ROWS" || obj.majorDimension == "COLS" ?
							obj.majorDimension : 
							"DIMENSION_UNSPECIFIED";

	return {
		range: sr,
		majorDimension: dim,
		values: values
	};
}

export function ValueRanges(obj : any) : ValueRanges | null {
	if (!obj || !obj.spreadsheetId || !obj.valueRanges)
		return null;

	return {
		spreadsheetId : obj.spreadsheetId,
		valueRanges : obj.valueRanges.map((vr : any) => ValueRange(vr))
	};
}