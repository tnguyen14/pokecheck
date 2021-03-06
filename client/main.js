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
const NUM_POKEMONS = 250;

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

async function formClickHandler (pokemon, e) {
	if (!user) {
		return;
	}
	let formEl = e.target.parentNode;
	formEl.classList.add('loading');
	let form = e.target.getAttribute('data-form');
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
	formEl.classList.remove('loading');
	// @TODO instead of querySelector again, use emit render in choo
	renderPokemon(pokemon);
}

function renderPokemon (pokemon) {
	const forms = ['default', 'female'];
	let el = document.querySelector(`[data-pokemon="${pokemon.name}"]`);
	if (!el) {
		el = document.createElement('div');
	}

	function generateClassList (userOwnership) {
		if (!userOwnership || !userOwnership[pokemon.name]) {
			return [];
		}
		let classes = ['owned'];
		forms.forEach((form) => {
			if (userOwnership[pokemon.name].includes(form)) {
				classes.push(`has-${form}`);
			}
			// only way to tell if female form exists is to check for sprites
			if (pokemon.sprites['front_' + form]) {
				classes.push(`has-sprite-${form}`);
			}
		});
		return classes;
	}
	let classList = ['pokemon'];
	if (user && user.ownership) {
		classList = classList.concat(generateClassList(user.ownership));
	}

	morphdom(el, `<div 
		class="${classList.join(' ')}"
		data-pokemon="${pokemon.name}"
		title="${pokemon.id}">
		<div class="name">
			${pokemon.name}
		</div>
		<div class="content-container">
			<div class="forms">
			${forms.map((form) => {
				return `<div class="form" data-form=${form}>
						<div class="loader"></div>
					</div>`;
			}).join('')}
			</div>
			<div class="images">
			${forms.map((form) => {
				if (!pokemon.sprites || !pokemon.sprites['front_' + form]) {
					return;
				}
				return `<img data-form=${form}
						src="${SERVER_URL}/sprites/${pokemon.id}/front_${form}">`;
			}).join('')}
			</div>
		</div>
	</div>`);

	return el;
}

async function getPokemons (numPokemons) {
	const appEl = document.querySelector('#app');
	let pokemonsEl = appEl.querySelector('.pokemons');
	if (!pokemonsEl) {
		pokemonsEl = document.createElement('div');
		pokemonsEl.classList.add('pokemons');
		appEl.appendChild(pokemonsEl);
	}

	// make array of number from 1 - NUM_POKEMONS
	// fetch all pokemons in parallel
	// then display them one by one
	return Array.from(new Array(numPokemons), (val, index) => index + 1).map(async (index) => {
		let response = await fetch(SERVER_URL + '/pokemon/' + index);
		return response.json();
	}).reduce(async (prevFetch, jsonResponse) => {
		await prevFetch;
		let pokemon = await jsonResponse;
		let pokemonEl = renderPokemon(pokemon);
		pokemonsEl.appendChild(pokemonEl);

		// add event listeners
		// @TODO this might be easily managed with choo
		Array.prototype.forEach.call(pokemonEl.querySelectorAll('.form'), (form) => {
			form.addEventListener('click', formClickHandler.bind(form, pokemon));
			form.addEventListener('mouseenter', () => {
				pokemonEl.classList.add('hover-' + form.getAttribute('data-form'));
			});
			form.addEventListener('mouseleave', () => {
				pokemonEl.classList.remove('hover-' + form.getAttribute('data-form'));
			});
		});
	}, Promise.resolve());
}

async function start () {
	router
		.on({
			'/:userId': (params) => {
				userId = params.userId;
			}
		})
		.resolve();

	try {
		user = await getUser(userId);
	} catch (e) {
		console.error(e);
	}

	await getPokemons(NUM_POKEMONS);
}

start();
