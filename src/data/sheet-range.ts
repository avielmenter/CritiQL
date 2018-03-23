export interface SheetCell {
	column : number,
	row : number
}

export interface SheetRange {
	sheet : string | void,
	startCell : SheetCell,
	endCell : SheetCell
}

export function numberToColumnName(n : number) : string {
	return n == 0 ? '' : 
		numberToColumnName(Math.floor((n - 1) / 26)) + 				// first digit
		String.fromCharCode('A'.charCodeAt(0) + ((n - 1) % 26));	// remaining digits
}

export function columnNameToNumber(c : string) : number {
	if (c.length == 0)
		return 0;

	const upper = c.toUpperCase();
	const digitValue = upper.charCodeAt(upper.length - 1) - 'A'.charCodeAt(0) + 1;

	if (digitValue < 1 || digitValue > 26)
		return -1;

	return digitValue + 26 * columnNameToNumber(upper.substr(0, upper.length - 1));
}

export function SheetCell (cell : string) : SheetCell | null {
	if (!cell)
		return null;

	const params = cell.trim().match(/([A-Z]*)([0-9]*)/i);

	if (params == null || params.length < 3)
		return null;
	
	const col = columnNameToNumber(params[1]);
	const row = +params[2];

	if (col <= 0 || row == NaN)
		return null;

	return {
		column: col,
		row: row
	};
}

export function SheetRange(range : string) : SheetRange | null {
	if (!range)
		return null;

	const params = range.trim().match(/(('[^']*')!)?([A-Z]*[0-9]*):([A-Z]*[0-9]*)/i);

	if (!params || params.length < 3)
		return null;

	const sheet = !params[2] ? undefined : params[2]; 
	const start = SheetCell(params[3]);
	const end = SheetCell(params[4]);

	if (!start || !end)
		return null;

	return {
		sheet: sheet,
		startCell: start,
		endCell: end
	};
}

export function cellToString(sc : SheetCell) : string {
	return numberToColumnName(sc.column) + sc.row;
}

export function rangeToString(sr : SheetRange) : string {
	const sheet = !sr.sheet ? '' : sr.sheet + '!';
	return sheet + cellToString(sr.startCell) + ':' + cellToString(sr.endCell);
}