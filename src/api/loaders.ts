import * as DataLoader from 'dataloader';
import { Connection } from 'mongoose';

import { getCharactersById } from '../data/schema/character';
import { getEpisodesById } from '../data/schema/episode';

export function getCharacterLoader(con : Connection) {
	return new DataLoader((keys : string[]) => getCharactersById(con, keys));
}

export function getEpisodeLoader(con : Connection) {
	return new DataLoader((keys : string[]) => getEpisodesById(con, keys));
}