const express = require('express');
const cors = require('cors');
const PouchDB = require('pouchdb');
const fetch = require('node-fetch');
const fse = require('fs-extra');
const config = require('config');
const app = express();
const SERVER_PORT = process.env.PORT || 3000;
const POKEAPI_URL = 'http://pokeapi.co/api/v2/';

app.use(cors({
	origin: config.get('CLIENT_URL')
}));

const db = new PouchDB(config.get('DATABASE_URL') + '/pokemons');

async function saveSprites (pokemon) {
	if (!pokemon.sprites) {
		return;
	}
	await Object.keys(pokemon.sprites).forEach(async (type) => {
		if (!pokemon.sprites[type]) {
			return;
		}
		let exists = await fse.pathExists(`./db/sprites/${pokemon.id}/${type}.png`);
		if (exists) {
			return;
		}
		let response = await fetch(pokemon.sprites[type]);
		await fse.mkdirs(`./db/sprites/${pokemon.id}`);
		response.body.pipe(fse.createWriteStream(`./db/sprites/${pokemon.id}/${type}.png`));
	});
}

app.get('/pokemon/:id', async (req, res) => {
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
		pokemon = await response.json();
		if (!pokemon) {
			return res.send(404).json({
				error: `${req.params.id} is not found`
			});
		}
		try {
			await db.put(Object.assign({}, pokemon, {
				// _id needs to be a string
				_id: pokemon.id.toString()
			}));
		} catch (e) {
			console.error(e);
		}
		res.json(pokemon);
	}
	await saveSprites(pokemon);
});

app.get('/sprites/:pokemon/:type', async (req, res) => {
	let filePath = `./db/sprites/${req.params.pokemon}/${req.params.type}.png`;
	let exists = await fse.pathExists(filePath);
	if (!exists) {
		res.sendStatus(404);
		return;
	}
	res.sendFile(filePath, {
		root: process.cwd()
	});
});

app.listen(SERVER_PORT, () => {
	console.log(`Express is listening on ${SERVER_PORT}`);
});

