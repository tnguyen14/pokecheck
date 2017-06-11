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
} else if (window.location.origin === 'http://173.56.227.43:9000') {
	SERVER_URL = homeConfig.SERVER_URL;
	// root = homeConfig.CLIENT_DOMAIN + '/pokecheck';
	root = homeConfig.CLIENT_DOMAIN;
}
const NUM_POKEMONS = 10;

const appEl = document.querySelector('#app');
const pokemonsEl = document.createElement('div');
pokemonsEl.classList.add('pokemons');
appEl.appendChild(pokemonsEl);

let router = new Navigo(root);

router.on({
	'/:userId': async (params) => {
		let response = await fetch(SERVER_URL + '/users/' + params.userId);
		let user = await response.json();
		console.log(user);
	}
}).resolve();

function createPokemonEl (pokemon) {
	let el = document.createElement('div');
	el.classList.add('pokemon');
	let name = document.createElement('div');
	name.classList.add('name');
	name.innerHTML = pokemon.name;
	el.appendChild(name);

	if (pokemon.sprites && pokemon.sprites.front_default) {
		let images = document.createElement('div');
		images.classList.add('images');
		let image = document.createElement('img');
		image.src = `${SERVER_URL}/sprites/${pokemon.id}/front_default`;
		images.appendChild(image);
		el.appendChild(images);
	}
	return el;
}

async function getPokemons (numPokemons) {
	// make array of number from 1 - NUM_POKEMONS
	return await Promise.all(Array.from(new Array(numPokemons), (val, index) => index + 1).map(async (index) => {
		let response = await fetch(SERVER_URL + '/pokemon/' + index);
		let pokemon = await response.json();
		return pokemon;
	}));
}

// display each pokemon
getPokemons(NUM_POKEMONS).then((pokemons) => {
	pokemons.forEach((pokemon) => {
		pokemonsEl.appendChild(createPokemonEl(pokemon));
	});
});

