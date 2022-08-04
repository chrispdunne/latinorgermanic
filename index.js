import fetch from 'node-fetch';
import jsdom from 'jsdom';
import express from 'express';
import JSONdb from 'simple-json-db';

const db = new JSONdb('db.json');

const port = process.env.PORT || 3113;

const app = express();
app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(express.json());

const { JSDOM } = jsdom;

function shuffle(array) {
	var j, x, i;
	for (i = array.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1));
		x = array[i];
		array[i] = array[j];
		array[j] = x;
	}
	return array;
}

function matchLanguage(etymology, language) {
	const ety = String(etymology).toLowerCase();
	if (language === 'germanic') {
		return (
			ety.includes(language) ||
			ety.includes('old english') ||
			ety.includes('middle english')
		);
	}
	return ety.includes(language);
}

const getRandomWord = async () => {
	const randomWord = await fetch(
		'https://random-word-api.herokuapp.com/word'
	);
	const wordText = await randomWord.text();
	const word = JSON.parse(wordText)[0];
	const response = await fetch(`https://www.etymonline.com/search?q=${word}`);
	const body = await response.text();

	const dom = new JSDOM(body);

	const etymology = dom.window.document.querySelector(
		'[class^="word__defination"]'
	)?.textContent;

	const latin = matchLanguage(etymology, 'latin');
	const germanic = matchLanguage(etymology, 'germanic');

	return { word, etymology, latin, germanic };
};

const handleGetRandomWord = async language => {
	let random;
	// @TODO consider not returning words without latin or germanic keywords
	do {
		random = await getRandomWord();
	} while (!random.etymology || !matchLanguage(random.etymology, language));
	return random;
};

const getXRandomWords = async (language, x) => {
	let words = [];
	for (let i = 0; i < x; i++) {
		const word = await handleGetRandomWord(language);
		words.push(word);
	}
	return words;
};

const get10RandomWords = async () => {
	let words = [];

	// check cache expiry
	const expiry = db.get('expiry');
	if (expiry && Number(expiry) > Date.now()) {
		// non-expired
		const _words = db.get('words');
		words = JSON.parse(_words);
		if (words && Array.isArray(words) && words.length > 0) {
			return words;
		}
	}

	// otherwise reset expiry, get new words and save to db
	const latinWords = await getXRandomWords('latin', 6);
	const germanicWords = await getXRandomWords('germanic', 4);
	words = shuffle([...latinWords, ...germanicWords]);

	db.set('words', JSON.stringify(words));
	db.set('expiry', Date.now() + 1000 * 60 * 60 * 24); // 24 hours
	return words;
};

app.get('/', async (req, res) => {
	const words = await get10RandomWords();
	const word = words[0];

	res.render('home', { ...word });
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});

// POST method route
app.post('/', (req, res) => {
	const words = JSON.parse(db.get('words'));

	// answer a guess
	if (req.body.guess) {
		const correct = words[req.body.guessCount][req.body.guess];

		res.json({ correct, guess: req.body.guess });
	}
	// send new word
	if (req.body.newGame) {
		const word = words[req.body.guessCount];

		res.json({ word });
	}
});
