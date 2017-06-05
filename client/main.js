const config = require('config');
const SERVER_URL = config.get('SERVER_URL');
const NUM_POKEMONS = 10;

const appEl = document.querySelector('#app');
const pokemonsEl = document.createElement('div');
pokemonsEl.classList.add('pokemons');
appEl.appendChild(pokemonsEl);

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
