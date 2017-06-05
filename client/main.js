/* global fetch */

const SERVER_URL = 'http://localhost:3000';
const NUM_POKEMONS = 10;

Array.from(new Array(NUM_POKEMONS), (val,index) => index + 1).map((index) => {
	fetch(SERVER_URL + '/pokemon/' + index).then((res) => {
		return res.json();
	}).then((json) => {
		console.log(json);
	});
});
