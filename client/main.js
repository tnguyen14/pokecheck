// config is not working with browser bundle right now,
// see https://github.com/lorenwest/node-config/issues/345
// trying to replicate it manually for now
import defaultConfig from '../config/default.json';
import productionConfig from '../config/production.json';
import homeConfig from '../config/home.json';
import Navigo from 'navigo';

let SERVER_URL = defaultConfig.SERVER_URL;
let root = defaultConfig.CLIENT_DOMAIN;

if (window.location.origin === 'https://lab.tridnguyen.com') {
	SERVER_URL = productionConfig.SERVER_URL;
	root = productionConfig.CLIENT_DOMAIN + '/pokecheck';
} else if (window.location.origin === 'https://lab.home.tridnguyen.com') {
	SERVER_URL = homeConfig.SERVER_URL;
	root = homeConfig.CLIENT_DOMAIN + '/pokecheck';
}
const NUM_POKEMONS = 10;

let router = new Navigo(root);

let userId;

router
	.on({
		'/:userId': async (params) => {
			userId = params.userId;
		}
	})
	.resolve();

async function getUser (userId) {
	if (!userId) {
		return Promise.resolve();
	}
	let response = await fetch(SERVER_URL + '/users/' + userId);
	return response.json();
}

function renderImages (pokemon, pokemonEl) {
	const imageForms = ['front_default', 'front_female'];
	let imagesEl = pokemonEl.querySelector('.images');
	if (!imagesEl) {
		imagesEl = document.createElement('div');
		imagesEl.classList.add('images');
		pokemonEl.appendChild(imagesEl);
	}
	if (!pokemon.sprites) {
		return imagesEl;
	}
	imageForms.forEach((imageForm) => {
		if (!pokemon.sprites[imageForm]) {
			return;
		}
		let imageEl = imagesEl.querySelector(`[data-form="${imageForm}"]`);
		if (!imageEl) {
			imageEl = document.createElement('img');
			imageEl.setAttribute('data-form', imageForm);
			imageEl.src = `${SERVER_URL}/sprites/${pokemon.id}/${imageForm}`;
			imagesEl.appendChild(imageEl);
		}
	});
	return imagesEl;
}

function renderOwnerships (userOwnership, rootEl) {
	const forms = ['default', 'shiny', 'female', 'shiny_female'];
	Object.keys(userOwnership).forEach((pokemon) => {
		let pokemonEl = rootEl.querySelector(`[data-pokemon="${pokemon}"]`);
		if (!pokemonEl) {
			return;
		}
		pokemonEl.classList.add('owned');
		forms.forEach((form) => {
			if (userOwnership[pokemon].contains(form)) {
				pokemonEl.classList.add(form);
			}
		});
	});
}

function renderPokemon (pokemon) {
	let el = document.querySelector(`[data-pokemon="${pokemon.name}"]`);
	if (!el) {
		el = document.createElement('div');
		el.classList.add('pokemon');
		el.setAttribute('data-pokemon', pokemon.name);
	}
	let nameEl = el.querySelector('.name');
	if (!nameEl) {
		nameEl = document.createElement('div');
		nameEl.classList.add('name');
		el.appendChild(nameEl);
		nameEl.innerHTML = pokemon.name;
	}
	if (pokemon.name !== nameEl.innerHTML) {
		nameEl.innerHTML = pokemon.name;
	}

	renderImages(pokemon, el);
	renderOwnerships(pokemon, el);

	return el;
}

function renderPokemons (pokemons) {
	const appEl = document.querySelector('#app');
	let pokemonsEl = appEl.querySelector('.pokemons');
	if (!pokemonsEl) {
		pokemonsEl = document.createElement('div');
		pokemonsEl.classList.add('pokemons');
		appEl.appendChild(pokemonsEl);
	}

	pokemons.forEach((pokemon) => {
		pokemonsEl.appendChild(renderPokemon(pokemon));
	});
	return pokemonsEl;
}

async function getPokemons (numPokemons) {
	// make array of number from 1 - NUM_POKEMONS
	return await Promise.all(Array.from(new Array(numPokemons), (val, index) => index + 1).map(async (index) => {
		let response = await fetch(SERVER_URL + '/pokemon/' + index);
		let pokemon = await response.json();
		return pokemon;
	}));
}

async function start () {
	let results = await Promise.all([
		getPokemons(NUM_POKEMONS),
		getUser(userId)
	]);

	let pokemons = results[0];

	let pokemonsEl = renderPokemons(pokemons);

	// if no userId (homepage?)
	if (!results[1]) {
		return;
	}

	renderOwnerships(results[1].ownership, pokemonsEl);
}

start();
