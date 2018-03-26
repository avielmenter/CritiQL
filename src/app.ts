import * as express from 'express';
import * as path from 'path';
import * as bodyParser from 'body-parser';
import * as methodOverride from 'method-override';
import * as dotenv from 'dotenv';
import * as logger from 'morgan';
import * as favicon from 'serve-favicon';

dotenv.config();
const app = express();

import apiRouter from './routes/api';

app.use(favicon(path.join(__dirname, '../public', 'favicon.ico')));
app.use('/bundle.js', (req, res) => { 
	res.sendFile(path.join(__dirname, '../dist/bundle.js'));
});
app.use(express.static(path.join(__dirname, '../public')));

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(methodOverride());

app.use('/graphql', apiRouter);

app.use((req, res, next) => {
	let err = new Error('Not Found');
	next(err);
});

app.use((err : Error, req : express.Request, res : express.Response, next : express.NextFunction) => {
	let status = err.message == 'Not Found' ? 404 : 500;
	
	res.locals.error = req.app.get('env') === 'development' ? err : {};
	res.status(status)

	console.error(err);

	if (status == 404)
		res.sendFile(path.join(__dirname, '../public/404.html'));
	else
		res.sendFile(path.join(__dirname, '../public/500.html'));
});

app.listen(process.env.PORT || 3000, () => console.log('CritiQL listening on port ' + (process.env.PORT || 3000) + '.'));

export default app;