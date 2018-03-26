import * as mongoose from 'mongoose';
import { SheetInfo } from '../sheets';

export interface Episode extends mongoose.Document {
	episodeNo? : number,
	title : string,
	url? : string,
	campaign : number,
	rollsInDB : boolean
};

type Model = mongoose.Model<Episode>

const schema : mongoose.Schema = new mongoose.Schema({
	episodeNo : Number,
	title : String,
	url : String,
	campaign : Number,
	rollsInDB : Boolean
});

export type EpisodeDictionary = { [episodeTitle : string] : Episode };

function getEpisodeNumber(title : string) : number | null {
	const parsed = title.match(/Episode (2-)?(\d+)/i);
	if (!parsed || parsed.length < 3 || !parsed[2])
		return null;

	return parseInt(parsed[2]);
}

function getModel(con : mongoose.Connection) : Model {
	return con.model('Episode', schema);
}

export async function createFromSheet(con : mongoose.Connection, sheet : SheetInfo, campaign : number = 1) : Promise<Episode> {	
	const model = getModel(con);
	
	const episodeDoc = {
		title: sheet.properties.title,
		episodeNo: getEpisodeNumber(sheet.properties.title),
		campaign: campaign,
	};

	return await model.findOneAndUpdate(
		{ title: sheet.properties.title },
		{ $set: episodeDoc },
		{ upsert: true, new: true }
	);
}

export async function getEpisodeByTitle(con : mongoose.Connection, title : string) : Promise<Episode | null> {
	const model = getModel(con);
	return await model.findOne({ title: new RegExp(title.trim(), 'i') });
}

export async function getEpisodeById(con : mongoose.Connection, id : string) : Promise<Episode | null> {
	const model = getModel(con);
	return await model.findById(id);
}

export async function markRollsInDB(episode : Episode) : Promise<Episode> {
	return episode.update(
		{ $set: { rollsInDB: true } },
		{ new: true }	
	);
}

export async function findEpisodes(con : mongoose.Connection, filter : any) : Promise<Episode[]> {
	const model = getModel(con);

	if (filter.id) {
		const episode = await model.findById(filter.id);
		return !episode ? [] : [episode];
	}
	
	let query : any = {};

	if (filter.campaign)
		query.campaign = filter.campaign;
	
	if (filter.title)
		query.title = filter.title;
	else if (filter.episodeNo)
		query.episodeNo = filter.episodeNo;
	else if (filter.episodeAtLeast || filter.episodeAtMost) {
		query.episodeNo = {};
		if (filter.episodeAtLeast)
			query.episodeNo.$gte = filter.episodeAtLeast;
		else if (filter.episodeAtMost)
			query.episodeNo.$lte = filter.episodeAtMost;
	}

	return await model.find(query);
	
}