import { Router, Request, Response, NextFunction } from 'express';
import { Connection } from 'mongoose';
import * as graphqlHTTP from 'express-graphql';

import * as Sheets from '../data/sheets';
import * as DB from '../data/schema/db';

import { CharacterDictionary } from '../data/schema/character';
import { EpisodeDictionary } from '../data/schema/episode';
import * as RequestLog from '../data/schema/request-log';

import { getQuerySchema } from '../api/schema';
import { getEpisodeLoader, getCharacterLoader } from '../api/loaders';

let router = Router();

function fillDBHandler(req : Request, res : Response, next : NextFunction) {
	const con = DB.getConnection();
	
	DB.fillDB(con, req.ip)
		.then(rolls => {
			console.log(rolls + " rolls added to database.")
			con.close();
		})
		.catch(err => {
			console.error(err)
			con.close();
		});

	next();
}

router.get('/', fillDBHandler, graphqlHTTP(async (req : any, res : Response) => ({
	schema: await getQuerySchema(req.dbConnection),
	graphiql: true,
	context: { 
		db: req.dbConnection,
		loaders: {
			episodes: getEpisodeLoader(req.dbConnection),
			characters: getCharacterLoader(req.dbConnection)
		}
	}
})));

router.post('/', graphqlHTTP(async (req : any, res : Response) => ({
	schema: await getQuerySchema(req.dbConnection),
	graphiql: false,
	context: { 
		db: req.dbConnection,
		loaders: {
			episodes: getEpisodeLoader(req.dbConnection),
			characters: getCharacterLoader(req.dbConnection)
		}
	}
})))

export default router;