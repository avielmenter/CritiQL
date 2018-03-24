import * as mongoose from 'mongoose';
import { SheetInfo } from '../sheets';

export interface Episode extends mongoose.Document {
	episodeNo? : number,
	title : string,
	url? : string,
	campaign : number
};

export type Model = mongoose.Model<Episode>

export const schema : mongoose.Schema = new mongoose.Schema({
	episodeNo : Number,
	title : String,
	url : String,
	campaign : Number
});

function getEpisodeNumber(title : string) : number | null {
	const parsed = title.match(/Episode (2-)?(\d+)/i);
	if (!parsed || parsed.length < 3 || !parsed[2])
		return null;

	return parseInt(parsed[2]);
}

export function getModel(con : mongoose.Connection) : Model {
	return con.model('Episode', schema);
}

export async function createFromSheet(con : mongoose.Connection, sheet : SheetInfo, campaign : number = 1) : Promise<Episode> {	
	const model = getModel(con);
	
	const episodeDoc = {
		title: sheet.properties.title,
		episodeNo: getEpisodeNumber(sheet.properties.title),
		campaign: campaign
	};

	return await model.create(episodeDoc);
}

export async function findByTitle(con : mongoose.Connection, title : string) : Promise<Episode | null> {
	const model = getModel(con);
	return await model.findOne({ title: new RegExp(title.trim(), 'i') });
}