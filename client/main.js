/* global fetch */

const SERVER_URL = 'http://localhost:3000';
const NUM_POKEMONS = 10;

const appEl = document.querySelector('#app');

function createPokemonEl (pokemon) {
	let el = document.createElement('div');
	el.classList.add('pokemon');
	let name = document.createElement('div');
	name.innerHTML = pokemon.name;
	el.appendChild(name);
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
		appEl.appendChild(createPokemonEl(pokemon));
	})
});
