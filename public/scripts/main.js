console.log('loaded');
const buttons = document.querySelectorAll('button');

const endGame = success => {
	const ety = document.querySelector('.etymology');
	ety.classList.add('visible');
	buttons.forEach(button => button.classList.add('hidden'));
	if (success) {
		document.querySelector('.success-msg').classList.add('visible');
		const wins = Number(window.localStorage.getItem('wins') ?? 0);
		window.localStorage.setItem('wins', wins + 1);
	} else {
		document.querySelector('.fail-msg').classList.add('visible');
		const losses = Number(window.localStorage.getItem('losses') ?? 0);
		window.localStorage.setItem('losses', losses + 1);
	}
};

const handleClick = async e => {
	const guess = e.target.id;

	if (e.target.dataset.language === guess) {
		console.log(guess, 'correct');
		endGame(true);
	} else {
		console.log(guess, 'wrong');
		endGame();
	}

	// const res = await fetch(`/`, {
	// 	method: 'POST',
	// 	headers: { 'Content-Type': 'application/json' },
	// 	body: JSON.stringify({ guess })
	// });
	// const answer = await res.json();
	// console.log({ answer });
};

buttons.forEach(button => button.addEventListener('click', handleClick));
