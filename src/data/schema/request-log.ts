import * as mongoose from 'mongoose';

export interface RequestLog extends mongoose.Document {
	createdAt : Date,
	updatedAt : Date,
	ip : string
}

type Model = mongoose.Model<RequestLog>;

const schema : mongoose.Schema = new mongoose.Schema({
	ip : String
}, {
	timestamps: {
		createdAt: 'createdAt',
		updatedAt: 'updatedAt'
	}
});

function getModel(con : mongoose.Connection) : Model {
	return con.model('Request', schema);
}

export async function createLog(con : mongoose.Connection, ip : string) : Promise<RequestLog> {
	const model = getModel(con);
	return model.create({ ip: ip });
}

export async function secondsSinceLastLog(con : mongoose.Connection) : Promise<number> {
	const model = getModel(con);

	const latest = await model.findOne().sort({ createdAt: -1 }).limit(1);

	if (!latest || !latest.createdAt)
		return Infinity;

	return (new Date().getTime() - latest.createdAt.getTime()) / 1000;
}