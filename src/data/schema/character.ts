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

const nameErrors : { [badName : string] : string } = {
	'Vex\'alhia': 'Vex\'ahlia',
	'Tibierus': 'Tiberius' 
}

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

	if (Object.keys(nameErrors).includes(formatted))
		return nameErrors[formatted];
	return formatted;
}

export async function getCharacterByName(con : mongoose.Connection, name : string) : Promise<Character | null> {
	const model = getModel(con);
	
	const query = {
		name: sanitizeCharacterName(name)
	};

	return await model.findOne(query);
}

export async function createCharacter(con : mongoose.Connection, name : string) : Promise<Character> {
	const model = getModel(con);

	return await model.findOneAndUpdate(
		{ name: sanitizeCharacterName(name) },
		{ name: sanitizeCharacterName(name) },
		{ upsert: true, new: true }
	);
}