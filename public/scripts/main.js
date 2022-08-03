console.log('loaded');
const guessButtons = document.querySelectorAll('button.guess');
const newButton = document.querySelector('#new_game');
const wordTitle = document.querySelector('.word');
const ety = document.querySelector('.etymology');
const successMsg = document.querySelector('.success-msg');
const failMsg = document.querySelector('.fail-msg');
const progressChips = document.querySelectorAll('.chip');
const scoreCount = document.querySelector('.score .count');

let guessCount = 0;
let guesses = [];

let gameEnded = false;

const resetGame = () => {
	newButton.classList.remove('visible');
	ety.classList.remove('visible');
	guessButtons.forEach(button => button.classList.remove('end'));
	guessButtons.forEach(button => button.classList.remove('correct'));
	guessButtons.forEach(button => button.classList.remove('wrong'));
	progressChips.forEach(button => button.classList.remove('current'));
	successMsg.classList.remove('visible');
	failMsg.classList.remove('visible');
};

const newGame = async () => {
	gameEnded = false;
	guessCount++;
	resetGame();
	progressChips[guessCount].classList.add('current');

	const res = await fetch(`/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ newGame: true, guessCount })
	});
	const { word } = await res.json();
	if (word?.word) {
		wordTitle.innerHTML = word.word;
	}
	if (word?.etymology) {
		ety.innerHTML = word.etymology;
	}
	console.log({ word });
};

const endGame = (guess, success) => {
	gameEnded = true;
	ety.classList.add('visible');
	guessButtons.forEach(button => button.classList.add('end'));
	if (success) {
		document.querySelector('.guess#' + guess).classList.add('correct');

		guesses[guessCount] = true;
		successMsg.classList.add('visible');
		const wins = Number(window.localStorage.getItem('wins') ?? 0);
		window.localStorage.setItem('wins', wins + 1);
		progressChips[guessCount].classList.add('correct');
		scoreCount.innerHTML = guesses.filter(guess => guess).length;
	} else {
		document.querySelector('.guess#' + guess).classList.add('wrong');

		guesses[guessCount] = false;
		failMsg.classList.add('visible');
		const losses = Number(window.localStorage.getItem('losses') ?? 0);
		window.localStorage.setItem('losses', losses + 1);
		progressChips[guessCount].classList.add('wrong');
	}

	if (guessCount < 9) {
		newButton.classList.add('visible');
	} else {
	}
};

const guess = async e => {
	if (gameEnded) return;
	const guess = e.target.id;
	const res = await fetch(`/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ guess, guessCount })
	});
	const answer = await res.json();
	console.log({ answer });
	if (answer.correct) {
		endGame(answer.guess, true);
	} else {
		endGame(answer.guess);
	}
};

guessButtons.forEach(button => button.addEventListener('click', guess));
newButton.addEventListener('click', newGame);
