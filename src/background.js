import axios from 'axios';

console.log('Hello Background');

// const audibleTabs = chrome.tabs.query({ audible: true }, (audibleTabs) => {
// 	console.log('retrieved audible tabs: ' + JSON.stringify(audibleTabs));
// });

// chrome.tabs.onActivated.addListener((tab) => {
// 	chrome.tabs.get(tab.tabId, (currentTabInfo) => {
// 		console.log('current tab info: ' + JSON.stringify(currentTabInfo));
// 	});
// });

const tabs = {};

const initTab = async (tabId) => {
	console.log('initTab called');

	if (!tabs[tabId]) {
		const audioCtx = new AudioContext();
		try {
			await chrome.tabCapture.capture(
				{ audio: true, video: false },
				async (stream) => {
					const streamSource = audioCtx.createMediaStreamSource(stream);
					const gainNode = audioCtx.createGain();
					const retrievedValue = 1;

					streamSource.connect(gainNode);
					gainNode.connect(audioCtx.destination);

					tabs[tabId] = {
						audioCtx,
						streamSource,
						gainNode,
						retrievedValue,
					};

					console.log(tabId + 'initialized');
					console.log(tabs);
				}
			);
		} catch (err) {
			console.log(err);
		}
	} else {
		console.log('tab already existed, ending initialization');
	}
};

const adjustVolume = async (tabId, value) => {
	console.log('adjustVolume called with tabId: ' + tabId);
	// if (!tabId in tabs) {
	// 	console.log('tab does not exist, initializing tab data: ' + tabId);
	// 	await initTab(tabId);
	// }
	if (tabs[tabId]) {
		try {
			tabs[tabId].gainNode.gain.value = value;
			chrome.browserAction.setBadgeText({
				tabId,
				text: Math.floor(value * 100).toString(),
			});
		} catch (err) {
			console.log(err);
		}
	} else {
		console.log('something went wrong while adjusting volume');
	}
	// chrome.browserAction.setBadgeText({
	// 	tabId,
	// 	text: Math.floor(value * 100).toString(),
	// });
	console.log('adjustVolume called: ' + tabs[tabId]);

	// updateBadge(tabId, value);
};

const setRetrievedVolume = async (tabId, retrievedValue) => {
	if (tabs[tabId]) {
		tabs[tabId].retrievedValue = retrievedValue;
	}
};

const getVolume = (tabId) => {
	return tabId in tabs ? tabs[tabId].gainNode.gain.value : 1;
};

const getRetrievedVolume = (tabId) => {
	return tabId in tabs ? tabs[tabId].retrievedValue : 1;
};

const parseUrl = (url) => {
	var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
	var match = url.match(regExp);
	return match && match[7].length == 11 ? match[7] : false;
};

const removeTab = async (tabId) => {
	if (tabId in tabs) {
		await tabs[tabId].audioCtx.close();
		delete tabs[tabId];
		console.log('tab and audiocontext removed: ' + tabs);
	}
};

chrome.browserAction.onClicked.addListener((tab) => initTab(tab.tabId));

chrome.tabs.onRemoved.addListener(removeTab);

// Handles messages from popup. SETVOLUME
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log('received on addListener: ' + JSON.stringify(message));
	switch (message.name) {
		case 'SETVOLUME': {
			console.log('SETVOLUME CALLED ' + message.tabId + ' ' + message.volume);
			adjustVolume(message.tabId, message.volume);
			return;
		}
		case 'GETVOLUME': {
			if (!(message.tabId in tabs)) {
				initTab(message.tabId);
			}
			console.log(
				`GETVOLUME MESSAGE RECEIVED. RESPONDING: ${getVolume(
					message.tabId
				)}, ${getRetrievedVolume(message.tabId)}`
			);
			sendResponse({
				volume: getVolume(message.tabId).toFixed(2),
				retrievedValue: getRetrievedVolume(message.tabId),
			});
			chrome.browserAction.getBadgeText({ tabId: message.tabId }, (result) => {
				if (!result) {
					chrome.browserAction.setBadgeText({
						tabId: message.tabId,
						text: '100',
					});
				}
			});
		}
		default: {
			return;
		}
	}
});

// chrome.browserAction.onClicked.addListener(() => {
// 	console.log('browseraction.onclicked fired');
// });

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.url) {
		var videoId = parseUrl(changeInfo.url);

		// if (videoId) {
		// 	adjustVolume(tabId, 1);
		// 	console.log('tabs: ' + tabs);
		// }

		if (videoId) {
			console.log('changedinfo.status: ' + changeInfo.status);
			try {
				console.log('detected a page change to a youtube video: ' + videoId);
				fetch(
					`https://us-central1-volume-adapt.cloudfunctions.net/api/youtube/${parseUrl(
						changeInfo.url
					)}`
				)
					.then((res) => {
						return res.json();
					})
					.then((data) => {
						console.log('data: ' + JSON.stringify(data));
						if (tabs[tabId]) {
							if (data.volume) {
								adjustVolume(tabId, (data.volume / 100).toFixed(2));
								setRetrievedVolume(
									tabId,
									Number((data.volume / 100).toFixed(2))
								);
							} else {
								console.log('no data existed, defaulting to volume at 100%');
								adjustVolume(tabId, 1);
								setRetrievedVolume(tabId, null);
							}
							console.log('tabs: ' + JSON.stringify(tabs));
						}
					});
			} catch (err) {
				console.log('addlistener error: ' + err);
			}
		} else {
			console.log(
				'detected page change, but was not a youtube video: ' +
					tabId +
					' ' +
					videoId
			);
		}
	}
});

// 1 check if tabId exists in tabs
// 2 if tabId exists, pull volume if it was manually adjusted (!= 100)
// 3
