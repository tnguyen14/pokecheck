const express = require('express');
const cors = require('cors');
const PouchDB = require('pouchdb');
const fetch = require('node-fetch');
const app = express();
const SERVER_PORT = process.env.PORT || 3000;
const POKEAPI_URL = 'http://pokeapi.co/api/v2/';

app.use(cors({
	origin: 'http://localhost:9000'
}));

app.use('/db', require('express-pouchdb')(PouchDB));

const db = new PouchDB('http://localhost:5984/pokemons');

app.get('/pokemon/:id', (async (req, res) => {
	let pokemon;
	try {
		pokemon = await db.get(req.params.id);
		res.json(pokemon);
	} catch (e) {
		if (e.error !== 'not_found') {
			console.error(e);
			res.send(400).json(e);
		}
		let response = await fetch(POKEAPI_URL + 'pokemon/' + req.params.id);
		let json = await response.json();
		if (!json) {console.log(req.params.id)}
		try {
			await db.put(Object.assign({}, json, {
				_id: json.id.toString()
			}));
		} catch (e) {
			console.error(e);
		}
		res.json(json);
	}
}));

app.listen(SERVER_PORT, () => {
	console.log(`Express is listening on ${SERVER_PORT}`);
});

