const State = Object.freeze({
	START: 'start',
	REALLY: 'really',
});
const TEXT = {
	[State.START]: [ 'Hey there bud.', 'It looks like you\'re doomscrolling again.\nAre you sure that\'s what you want to do?'],
	[State.REALLY]: [ 'Really?', 'Are you sure?'],
};
const BUTTONS = {
	[State.START]: [ ['No', closeCurrentTab], ['Yes', () => State.REALLY] ],
	[State.REALLY]: [ ['No', closeCurrentTab], ['Yes', () => State.START] ],
};

let popup = null;
let state = State.START;

function newEl(tag, parent = null) {
	const el = document.createElement(tag);
	if(parent) {
		parent.appendChild(el);
	}
	return el;
}

function newButton(innerText, parent = null, callback = null) {
	const button = newEl('button', parent);
	button.innerText = innerText;
	button.style['font-size'] = '2rem';
	button.onclick = callback;
	return button;
}

function createPopup() {
	popup = newEl('div', document.body);
	popup.style.position = 'absolute';
	popup.style.left = 0;
	popup.style.top = 0;
	popup.style.width = '100vw';
	popup.style.height = '100vh';
	popup.style.background = '#999';
	popup.style.opacity = 0.2;
	popup.style['z-index'] = 1000000;
	const div = newEl('div', document.body);
	div.style.position = 'absolute';
	div.style.left = '10vw';
	div.style.top = '10vh';
	div.style.width = '80vw';
	div.style.height = '80vh';
	div.style.background = '#111';
	div.style.color = '#ddd';
	div.style['z-index'] = 1000001;
	div.style['text-align'] = 'center';
	div.style['border-radius'] = '1rem';
	div.style['font-size'] = '2rem';
	const h1 = newEl('h1', div);
	h1.style.margin = '1rem';
	const pTag = newEl('p', div);
	const updateText = () => {
		[h1.innerText, pTag.innerText] = TEXT[state];
		const buttons = BUTTONS[state].map(([text, callback]) => newButton(text, div, () => {
			state = callback();
			buttons.forEach(button => button.remove());
			updateText();
		}));
	};
	updateText();
}

function removePopup() {
	popup.remove();
	popup = null;
}

async function closeCurrentTab() {
	chrome.runtime.sendMessage({
		type: 'closeCurrentTab',
	});
}

function pauseVideo() {
	const video = document.querySelector('video');
	if(video) {
		video.pause();
	}
}

setInterval(() => {
	const shorts = document.location.pathname.includes('/shorts/');
	if(popup && !shorts) {
		removePopup();
	} else if(!popup && shorts) {
		createPopup();
		pauseVideo();
	} else if(popup && shorts) {
		pauseVideo();
	}
}, 100);
