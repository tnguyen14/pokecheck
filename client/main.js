// config is not working with browser bundle right now,
// see https://github.com/lorenwest/node-config/issues/345
// trying to replicate it manually for now
import defaultConfig from '../config/default.json';
import productionConfig from '../config/production.json';
import homeConfig from '../config/home.json';
import Navigo from 'navigo';
import morphdom from 'morphdom';
import deepClone from 'deep-clone';

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
let user;

async function getUser (userId) {
	if (!userId) {
		return Promise.resolve();
	}
	let response = await fetch(SERVER_URL + '/users/' + userId);
	return response.json();
}

function updateOwnerships (userOwnership, rootEl) {
	const forms = ['default', 'shiny', 'female', 'shiny_female'];
	Object.keys(userOwnership).forEach((pokemon) => {
		let pokemonEl = rootEl.querySelector(`[data-pokemon="${pokemon}"]`);
		if (!pokemonEl) {
			return;
		}
		pokemonEl.classList.add('owned');
		forms.forEach((form) => {
			let clx = `has-${form}`;
			if (userOwnership[pokemon].includes(form)) {
				pokemonEl.classList.add(clx);
			} else {
				if (pokemonEl.classList.contains(clx)) {
					pokemonEl.classList.remove(clx);
				}
			}
		});
	});
}

function renderPokemon (pokemon) {
	const imageForms = ['front_default', 'front_female'];
	let el = document.querySelector(`[data-pokemon="${pokemon.name}"]`);
	if (!el) {
		el = document.createElement('div');
	}

	morphdom(el, `<div class="pokemon" data-pokemon="${pokemon.name}">
		<div class="name">
			${pokemon.name}
		</div>
		<div class="images">
		${imageForms.map((imageForm) => {
			if (!pokemon.sprites || !pokemon.sprites[imageForm]) {
				return;
			}
			return `<div class="image">
					<img data-form=${imageForm}
					src="${SERVER_URL}/sprites/${pokemon.id}/${imageForm}">
					<div class="loader"></div>
				</div>`;
		}).join('')}
		</div>
	</div>`);

	// @TODO this event listening can be easily managed with choo
	Array.prototype.forEach.call(el.querySelectorAll('img'), (img) => {
		img.addEventListener('click', updateOwn);
	});
	async function updateOwn (e) {
		if (!user) {
			return;
		}
		let imageEl = e.target.parentNode;
		imageEl.classList.add('loading');
		let imageForm = e.target.getAttribute('data-form');
		let form = imageForm.split('_')[1];
		if (!form) {
			throw new Error('No form found');
		}
		if (!user.ownership) {
			user.ownership = {};
		}
		let prevOwnership = deepClone(user.ownership[pokemon.name]);
		if (!prevOwnership) {
			user.ownership[pokemon.name] = [form];
		} else {
			let hasForm = user.ownership[pokemon.name].findIndex((ownedForm) => {
				return ownedForm === form;
			});
			// if form does not exist
			if (hasForm === -1) {
				user.ownership[pokemon.name].push(form);
			} else {
				user.ownership[pokemon.name].splice(hasForm, 1);
			}
		}
		try {
			await fetch(`${SERVER_URL}/users/${userId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(user)
			});
		} catch (e) {
			console.error(e);
			// reverting changes
			user.ownership[pokemon.name] = prevOwnership;
		}
		imageEl.classList.remove('loading');
		// @TODO instead of querySelector again, use emit render in choo
		updateOwnerships(user.ownership, document.querySelector('.pokemons'));
	}

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
	router
		.on({
			'/:userId': (params) => {
				userId = params.userId;
			}
		})
		.resolve();

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

	user = results[1];
	if (user.ownership) {
		updateOwnerships(user.ownership, pokemonsEl);
	}
}

start();
