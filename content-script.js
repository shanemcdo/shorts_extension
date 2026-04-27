const State = Object.freeze({
	START: 0,
	REALLY: 1,
	HOW_LONG: 2,
	WAITING: 3,
	DONE_WAITING: 4,
});
const WaitingType = Object.freeze({
	FIVE_MINUTES: 0,
	ONE_SHORT: 1,
});

let state = State.START;
let waitingType = WaitingType.FIVE_MINUTES;
let popup = null;
let isActive = true;
let prev_video_src = null;
let prev_short_count = 0;
let short_count = 0;
const start_time = Date.now();

const TEXT = {
	[State.START]: [ 'Hey there bud.', 'It looks like you\'re doomscrolling again.\nAre you sure that\'s what you want to do?'],
	[State.REALLY]: [ 'Really?', async () => {
		return await hasMindlessScrollingBookmark() ?
		'Are you sure? I\'m going to reset the doomscroll timer.' :
		'Are you sure?'
	}],
	[State.HOW_LONG]: [ 'Fine', 'How long are you going to doomscroll?'],
	[State.WAITING]: () => waitingType === WaitingType.FIVE_MINUTES 
		? [ 'Okayyyy', 'I\'ll check back up on you in 5 minutes.']
		: [ 'Fineeee', 'I\'ll come back after one short'],
	[State.DONE_WAITING]: () => {
		const choice = waitingType === WaitingType.FIVE_MINUTES
			? '5 minutes'
			: '1 short';
		const elapsed_ms = Date.now() - start_time;
		const elapsed_mins = elapsed_ms / 1000 / 60
		return [ 'Hello again!', `It\'s been ${choice}. You done? You've watched a total of ${short_count - 1} shorts in ${elapsed_mins} minutes`]
	}
};
const BUTTONS = {
	[State.START]: [ ['No', closeCurrentTab], ['Yes', () => State.REALLY] ],
	[State.REALLY]: [ ['No :(', closeCurrentTab], ['Yes Really', () => State.HOW_LONG] ],
	[State.HOW_LONG]: [
		['I\'ll stop', closeCurrentTab],
		['5 Minutes', giveFiveMinutes],
		['Just this one short', giveOneShort]
	],
	[State.WAITING]: [ ['Ok', () => {
		removePopup();
		return State.WAITING;
	}] ],
	[State.DONE_WAITING]: [ ['Ok, yeah I\'m done', closeCurrentTab], ['No I\'m not done', () => State.HOW_LONG] ],
};


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
	button.style.background = 'hsl(0, 0%, 20%)';
	button.style.color = '#ddd';
	return button;
}

async function createPopup() {
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
	div.style.left = '20vw';
	div.style.top = '20vh';
	div.style.width = '60vw';
	div.style.height = '60vh';
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
	const updateText = async () => {
		let text = TEXT[state] ?? ['', ''];
		if(typeof text === 'function') {
			text = text();
		}
		const [h1_innerText, pTag_innerText] = await text;
		h1.innerText = await (typeof h1_innerText === 'function' ? h1_innerText() : h1_innerText);
		pTag.innerText = await (typeof pTag_innerText === 'function' ? pTag_innerText() : pTag_innerText);
		let buttons = BUTTONS[state] ?? [];
		if(typeof buttons === 'function') {
			buttons = await buttons();
		}
		buttons = await Promise.all((buttons).map(async ([text, callback]) =>
			newButton(
				await (typeof text === 'function' ? text() : text),
				div,
				async () => {
					state = await callback();
					buttons.forEach(button => button.remove());
					await updateText();
				}
			)
		));
	};
	await updateText();
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
		state = State.DONE_WAITING;
		isActive = true;
	}, 5 * 60 * 1000);
	isActive = false;
	waitingType = WaitingType.FIVE_MINUTES;
	resetMindlessScrollingBookmark();
	return State.WAITING;
}

function giveOneShort() {
	isActive = false;
	waitingType = WaitingType.ONE_SHORT;
	prev_short_count = short_count;
	const interval = setInterval(() => {
		if(short_count > prev_short_count) {
			state = State.DONE_WAITING;
			isActive = true;
			clearInterval(interval);
		}
	}, 100);
	resetMindlessScrollingBookmark();
	return State.WAITING;
}


function getVideo() {
	return document.querySelector('video');
}

function pauseVideo() {
	const videos = document.querySelectorAll('video');
	for(const video of videos) {
		video.pause();
	}
}

async function hasMindlessScrollingBookmark() {
	return await chrome.runtime.sendMessage({ type: 'hasMindlessScrolling'});
}

async function resetMindlessScrollingBookmark() {
	await chrome.runtime.sendMessage({ type: 'resetMindlessScrolling'});
}

function removeSuggestions() {
	const remove = item => item.remove();
	document.querySelectorAll('div.ytd-rich-grid-renderer').forEach(remove)
}

(() => {
	setInterval(async () => {
		const video = getVideo();
		if(video?.src !== prev_video_src) {
			prev_video_src = video?.src;
			short_count++;
		}
		if(!isActive || short_count < 2) return;
		const shorts = document.location.pathname.includes('/shorts/');
		if(popup && !shorts) {
			removePopup();
		} else if(!popup && shorts) {
			await createPopup();
			pauseVideo();
		} else if(popup && shorts) {
			pauseVideo();
		}
	}, 100);

	setInterval(removeSuggestions, 100);
})();
