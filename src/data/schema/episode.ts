import * as mongoose from 'mongoose';
import { SheetInfo } from '../sheets';

export interface Episode extends mongoose.Document {
	episodeNo?: number,
	title: string,
	url?: string,
	campaign: number,
	rollsInDB: boolean
};

type Model = mongoose.Model<Episode>

const schema: mongoose.Schema = new mongoose.Schema({
	episodeNo: Number,
	title: String,
	url: String,
	campaign: Number,
	rollsInDB: Boolean
});

export type EpisodeDictionary = { [episodeTitle: string]: Episode };

function getEpisodeNumber(title: string): number | null {
	const parsed = title.match(/(Episode (2-)?(\d+))|(C\dE(\d+))/i);
	if (!parsed || parsed.length < 6)
		return null;
	if (parsed[1] && parsed[3]) 	// if matches Episode (2-)?(\d+), return the (\d+)
		return parseInt(parsed[3]);
	if (parsed[4] && parsed[5])		// if matches C\dE(\d+), return the (\d+)
		return parseInt(parsed[5]);
	return null;
}

function getModel(con: mongoose.Connection): Model {
	return con.model('Episode', schema);
}

export async function createFromSheet(con: mongoose.Connection, sheet: SheetInfo, campaign: number = 1): Promise<Episode> {
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

export async function getEpisodeByTitle(con: mongoose.Connection, title: string): Promise<Episode | null> {
	const model = getModel(con);
	return await model.findOne({ title: new RegExp(title.trim(), 'i') });
}

export async function getEpisodeById(con: mongoose.Connection, id: string): Promise<Episode | null> {
	const model = getModel(con);
	return await model.findById(id);
}

export async function getEpisodesById(con: mongoose.Connection, ids: string[]): Promise<(Episode | null)[]> {
	const model = getModel(con);
	const matching = await model.find({ _id: { $in: ids } });

	return ids.map(id => matching.find(e => e._id.toString() == id) || null);
}

export async function markRollsInDB(episode: Episode): Promise<Episode> {
	return await episode.update(
		{ $set: { rollsInDB: true } },
		{ new: true }
	);
}

export async function findEpisodes(con: mongoose.Connection, filter: any): Promise<Episode[]> {
	const model = getModel(con);

	if (filter.id) {
		const episode = await model.findById(filter.id);
		return !episode ? [] : [episode];
	}

	let query: any = {};

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