let popup = null;

function newEl(tag, parent = null) {
	const el = document.createElement(tag);
	if(parent) {
		parent.appendChild(el);
	}
	return el;
}

function createPopup() {
	const div = newEl('div', document.body);
	popup = div;
	div.style.position = 'absolute';
	div.style.left = '10vw';
	div.style.top = '10vh';
	div.style.width = '80vw';
	div.style.height = '80vh';
	div.style.background = 'black';
	div.style['z-index'] = 1000000;
	div.style['text-align'] = 'center';
}

function removePopup() {
	popup.remove();
	popup = null;
}

setInterval(() => {
	const shorts = document.location.pathname.includes('/shorts/');
	if(popup && !shorts) {
		removePopup();
	} else if(!popup && shorts) {
		createPopup();
	}
}, 100);
