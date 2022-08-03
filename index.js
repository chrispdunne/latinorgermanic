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

	const latin = String(etymology).toLowerCase().includes('latin');
	const germanic = String(etymology).toLowerCase().includes('germanic');

	return { word, etymology, latin, germanic };
};
const handleGetRandomWord = async () => {
	let random;
	// @TODO consider not returning words without latin or germanic keywords
	do {
		random = await getRandomWord();
	} while (!random.etymology || (!random.latin && !random.germanic));
	return random;
};

const get10RandomWords = async () => {
	let words = [];

	// check cache expiry
	const expiry = db.get('expiry');
	if (expiry && Number(expiry) > Date.now()) {
		console.log('expiry:', expiry);
		// non-expired
		const _words = db.get('words');
		words = JSON.parse(_words);
		if (words && Array.isArray(words) && words.length > 0) {
			return words;
		}
	}

	// otherwise reset expiry, get new words and save to db

	for (let i = 0; i < 10; i++) {
		const word = await handleGetRandomWord();
		words.push(word);
	}
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
	console.log(req.body);

	// answer a guess
	if (req.body.guess) {
		const correct = words[req.body.guessCount][req.body.guess];
		console.log(correct);
		res.json({ correct });
	}
	// send new word
	if (req.body.newGame) {
		const word = words[req.body.guessCount];

		res.json({ word });
	}

	// res.json({ requestBody: req.body });

	// res.send('POST request to the homepage');
});
