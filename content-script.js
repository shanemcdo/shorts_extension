const State = Object.freeze({
	START: 0,
	REALLY: 1,
	HOW_LONG: 2,
	WAITING_FIVE_MINUTES: 3,
	DONE_WAITING_FIVE_MINUTES: 4,
	WAITING_ONE_SHORT: 5,
	DONE_WAITING_ONE_SHORT: 6,
});
const TEXT = {
	[State.START]: [ 'Hey there bud.', 'It looks like you\'re doomscrolling again.\nAre you sure that\'s what you want to do?'],
	[State.REALLY]: [ 'Really?', 'Are you sure?'],
	[State.HOW_LONG]: [ 'Fine', 'How long are you going to doomscroll?'],
	[State.WAITING_FIVE_MINUTES]: [ 'Okayyyy', 'I\'ll check back up on you in 5 minutes.'],
	[State.DONE_WAITING_FIVE_MINUTES]: [ 'Hello again!', 'It\'s been 5 minutes. You done?'],
	[State.WAITING_ONE_SHORT]: [ 'Fineeee', 'I\'ll come back after one short'],
	[State.DONE_WAITING_ONE_SHORT]: [ 'I\'m Back!', 'It\'s been 1 short. You done?'],
};
const BUTTONS = {
	[State.START]: [ ['No', closeCurrentTab], ['Yes', () => State.REALLY] ],
	[State.REALLY]: [ ['No :(', closeCurrentTab], ['Yes Really', () => State.HOW_LONG] ],
	[State.HOW_LONG]: [
		['I\'ll stop', closeCurrentTab],
		['5 Minutes', giveFiveMinutes],
		['Just this one short', giveOneShort]
	],
	[State.WAITING_FIVE_MINUTES]: [ ['Ok', () => {
		removePopup();
		return State.WAITING_FIVE_MINUTES;
	}] ],
	[State.DONE_WAITING_FIVE_MINUTES]: [ ['Ok, yeah I\'m done', closeCurrentTab], ['No I\'m not done', () => State.HOW_LONG] ],
	[State.WAITING_ONE_SHORT]: [ ['Ok', () => {
		removePopup();
		return State.WAITING_ONE_SHORT;
	}] ],
	[State.DONE_WAITING_ONE_SHORT]: [ ['Ok, yeah I\'m done', closeCurrentTab], ['No I\'m not done', () => State.HOW_LONG] ],
};

let popup = null;
let state = State.START;
let isActive = true;
let prev_video_src = null;
let prev_short_count = 0;
let short_count = 0;

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
	button.onclick = callback;
	button.style.margin = '1rem 0';
	button.style['font-size'] = '2rem';
	return button;
}

function createPopup() {
	popup = newEl('div', document.body);
	popup.style.position = 'absolute';
	popup.style.left = 0;
	popup.style.top = 0;
	popup.style.width = '100vw';
	popup.style.height = '100vh';
	popup.style.background = 'rgba(153, 153, 153, 0.5)';
	popup.style['z-index'] = 1000000;
	const div = newEl('div', popup);
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
	pTag.style.margin = '1rem';
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


function giveFiveMinutes() {
	setTimeout(() => {
		state = State.DONE_WAITING_FIVE_MINUTES;
		isActive = true;
	}, 5 * 60 * 1000);
	isActive = false;
	return State.WAITING_FIVE_MINUTES;
}

function giveOneShort() {
	isActive = false;
	prev_short_count = short_count;
	const interval = setInterval(() => {
		if(short_count > prev_short_count) {
			state = State.DONE_WAITING_ONE_SHORT;
			isActive = true;
			clearInterval(interval);
		}
	}, 100);
	return State.WAITING_ONE_SHORT;
}


function getVideo() {
	return document.querySelector('video');
}

function pauseVideo() {
	const video = getVideo();
	if(video) {
		video.pause();
	}
}

setInterval(() => {
	const video = getVideo();
	if(video?.src !== prev_video_src) {
		prev_video_src = video?.src;
		short_count++;
	}
	if(!isActive) return;
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
