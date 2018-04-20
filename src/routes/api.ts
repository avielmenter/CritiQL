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
	DB.useTemporaryConnection((con : Connection) => DB.fillDB(con, req.ip))
		.then(rolls => console.log(rolls + " rolls added to database."))
		.catch(err => console.error(err));

	next();
}

function getGraphQLMiddleware(useGraphiql : boolean) : graphqlHTTP.Middleware {
	const con = DB.getConnection();

	return graphqlHTTP(async (req : any, res : Response) => ({
		schema: await getQuerySchema(con),
		graphiql: useGraphiql,
		context: { 
			db: con,
			loaders: {
				episodes: getEpisodeLoader(con),
				characters: getCharacterLoader(con)
			}
		}
	}));
}

router.get('/', fillDBHandler, getGraphQLMiddleware(true));
router.post('/', getGraphQLMiddleware(false));

export default router;