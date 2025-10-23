function newEl(tag, parent = null) {
	const el = document.createElement(tag);
	if(parent) {
		parent.appendChild(el);
	}
	return el;
}

// set up list in top left
(() => {
	const div = newEl('div', document.body);
	div.style.position = 'absolute';
	div.style.left = '10vw';
	div.style.top = '10vh';
	div.style.width = '80vw';
	div.style.height = '80vh';
	div.style.background = 'black';
	div.style['text-align'] = 'center';
})();
