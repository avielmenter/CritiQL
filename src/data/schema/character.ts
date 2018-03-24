import * as mongoose from 'mongoose';

export interface Character extends mongoose.Document {
	name : string
};

export type Model = mongoose.Model<Character>;

export const schema : mongoose.Schema = new mongoose.Schema({
	name : String
});

export function getModel(con : mongoose.Connection) : Model {
	return con.model('Character', schema);
}

export async function getCharacterByName(con : mongoose.Connection, name : string) : Promise<Character | null> {
	const model = getModel(con);
	
	const query = {
		name: new RegExp(name.trim(), 'i')
	};

	return await model.findOne(query);
}