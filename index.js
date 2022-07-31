import fetch from 'node-fetch';
import jsdom from 'jsdom';
import express from 'express';

const port = process.env.PORT || 3113;

const app = express();
app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(express.json());

const { JSDOM } = jsdom;

let random = {};

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

	return { word, etymology };
};
const handleGetRandomWord = async () => {
	do {
		random = await getRandomWord();
	} while (!random.etymology);
	return random;
};

app.get('/', async (req, res) => {
	await handleGetRandomWord();
	const { etymology } = random;
	if (String(etymology).toLowerCase().includes('latin')) {
		random.latin = true;
	}
	if (String(etymology).toLowerCase().includes('germanic')) {
		random.germanic = true;
	}
	res.render('home', random);
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});

// POST method route
app.post('/', (req, res) => {
	console.log(req.body);

	res.json({ requestBody: req.body });

	// res.send('POST request to the homepage');
});
