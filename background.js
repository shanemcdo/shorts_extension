const BASE_URL = 'shanemcd.net/since/';

async function closeCurrentTab() {
	// https://developer.chrome.com/docs/extensions/reference/api/tabs#get_the_current_tab
	let queryOptions = { active: true, lastFocusedWindow: true };
	// `tab` will either be a `tabs.Tab` instance or `undefined`.
	let [tab] = await chrome.tabs.query(queryOptions);
	if(!tab) return;
	chrome.tabs.remove(tab.id);
};

async function getMindlessScrolling() {
	const bookmarks = await chrome.bookmarks.search({ query: BASE_URL });
	for(const bookmark of bookmarks) {
		const url = new URL(bookmark.url);
		if(url.searchParams.get('name') === 'Mindless Scrolling') {
			return bookmark;
		}
	};
	return null;
};

async function hasMindlessScrolling() {
	const bookmark = await getMindlessScrolling();
	return bookmark != null;
};

async function resetMindlessScrolling() {
	const bookmark = await getMindlessScrolling();
	const url = new URL(bookmark.url);
	url.searchParams.set('date', Date.now());
	await chrome.bookmarks.update(bookmark.id, { url: url.toString() });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	switch(request.type) {
	case 'closeCurrentTab':
			closeCurrentTab();
			sendResponse(null);
			break;
	case 'hasMindlessScrolling':
			hasMindlessScrolling().then(sendResponse);
			break;
	case 'resetMindlessScrolling':
			resetMindlessScrolling();
			sendResponse(null);
			break;
	default:
		throw new Error(`Invalid request type ${type}`);
	}
	// This needs to be here to allow async
	return true;
});
