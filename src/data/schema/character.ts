import * as mongoose from 'mongoose';

export interface Character extends mongoose.Document {
	name : string
};

type Model = mongoose.Model<Character>;

const schema : mongoose.Schema = new mongoose.Schema({
	name : {
		type : String,
		required : true,
		unique : true
	}
});

const NAME_ERRORS : { [badName : string] : string } = {
	'Vex\'alhia': 'Vex\'ahlia',
	'Tibierus': 'Tiberius' 
}

const INVALID_CHARACTERS = ['Na', '1 Freq', '20 Freq', ''];

export type CharacterDictionary = { [characterName : string] : Character };

function getModel(con : mongoose.Connection) : Model {
	return con.model('Character', schema);
}

export function sanitizeCharacterName(name : string) : string {
	let formatted = (!name ? '' : name).toLowerCase().trim().replace(/\s+/i, ' ');

	for (let i = 0; i < formatted.length; i++) {
		if (i == 0 || formatted[i - 1] == ' ')
			formatted = formatted.substr(0, i) + formatted[i].toUpperCase() + formatted.substr(i + 1);
	}

	if (Object.keys(NAME_ERRORS).includes(formatted))
		return NAME_ERRORS[formatted];
	return formatted;
}

export async function getCharacterByName(con : mongoose.Connection, name : string) : Promise<Character | null> {
	const model = getModel(con);
	
	const query = {
		name: sanitizeCharacterName(name)
	};

	return await model.findOne(query);
}

export async function getCharacterById(con : mongoose.Connection, id : string) : Promise<Character | null> {
	const model = getModel(con);
	return await model.findById(id);
}

export async function createCharacter(con : mongoose.Connection, name : string) : Promise<Character | null> {
	const model = getModel(con);
	const sanitizedName = sanitizeCharacterName(name);

	if (INVALID_CHARACTERS.includes(sanitizedName))
		return null;

	return await model.findOneAndUpdate(
		{ name: sanitizedName },
		{ name: sanitizedName },
		{ upsert: true, new: true }
	);
}

export async function findCharacters(con : mongoose.Connection, filter : any) : Promise<Character[]> {
	const model = getModel(con);

	if (filter.id) {
		const character = await model.findById(filter.id);
		return !character ? [] : [character];
	}

	let query : any = {};
	
	if (filter.name)
		query.name = sanitizeCharacterName(filter.name);

	return await model.find(query);
}
