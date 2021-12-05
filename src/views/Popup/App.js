import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import Slider from '@material-ui/core/Slider';
import VolumeDown from '@material-ui/icons/VolumeDown';
import VolumeUp from '@material-ui/icons/VolumeUp';
import Button from '@material-ui/core/Button';

import './App.css';
import { makeStyles } from '@material-ui/core';
import { blue } from '@material-ui/core/colors';

const useSliderStyles = makeStyles({
	root: {
		height: 8,
		width: '100%',
	},
	// rail: {
	// 	width: '90%',
	// 	height: '12px',
	// },
	mark: {
		color: 'blue',
		height: '16px',
		width: '16px',
		borderRadius: '8px',
		transform: 'translateX(-50%) translateY(-45%)',
		backgroundColor: 'rgba(240,240,240,0.8)	',
	},
	markLabel: {
		marginTop: '8px',
		color: '#f1f6f9',
	},
});

const useButtonStyles = makeStyles({
	root: {
		color: '#f1f6f9',
		backgroundColor: '#3282b8',
		width: '100%',
		'&:hover': {
			backgroundColor: '#0f4c75',
		},
	},
});

const App = () => {
	const [audibleTabs, setAudibleTabs] = useState();
	const [volume, setVolume] = useState(100);
	const [retrievedValue, setRetrievedValue] = useState([
		{
			value: 100,
			label: '100%',
		},
	]);
	const [buttonMessage, setButtonMessage] = useState('Upload Volume');

	const sliderClasses = useSliderStyles();
	const buttonClasses = useButtonStyles();

	const handleSliderChange = (event, value) => {
		setVolume(value);
		updateVolume();
	};

	const parseUrl = (url) => {
		var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
		var match = url.match(regExp);
		return match && match[7].length == 11 ? match[7] : false;
	};

	const getActiveTabId = () => {};

	const updateVolume = () => {
		chrome.tabs.query({ active: true, currentWindow: true }, (activeTab) => {
			const message = {
				name: 'SETVOLUME',
				tabId: activeTab[0].id,
				volume: (volume / 100).toFixed(2),
			};
			console.log(
				'message sent through chrome runtime: ' + JSON.stringify(message)
			);
			chrome.runtime.sendMessage(message);
		});
	};

	const getVolume = async () => {
		chrome.tabs.query(
			{
				active: true,
				currentWindow: true,
			},
			(activeTab) => {
				const tabId = activeTab[0].id;
				console.log('getActiveTabId called. tabId: ' + tabId);
				const message = {
					name: 'GETVOLUME',
					tabId: tabId,
					volume: 1,
				};
				console.log('GETVOLUME SENDING MESSAGE: ' + JSON.stringify(message));
				chrome.runtime.sendMessage(message, (res) => {
					console.log(
						'fetched volume from background and set to state: ' + res
					);
					var value = Math.round(res.volume * 100);
					setVolume(value);
					if (res.retrievedValue !== null) {
						var retrievedValue = Math.round(res.retrievedValue * 100);
						setRetrievedValue([
							{ value: retrievedValue, label: `${retrievedValue}%` },
						]);
					} else {
						setRetrievedValue([]);
					}
				});
			}
		);
	};

	const uploadVolume = async () => {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const currentUrl = tabs[0].url;
			const videoId = parseUrl(currentUrl);

			if (videoId) {
				setButtonMessage('Uploading..');
				axios
					.post(
						'https://us-central1-volume-adapt.cloudfunctions.net/api/youtube',
						{
							id: videoId,
							value: volume,
						}
					)
					.then((res) => setButtonMessage('Successfully Uploaded'))
					.then(console.log(`${videoId} upload sent with volume of ${volume}`))
					.catch((err) => {
						console.log(err);
						setButtonMessage('An Error Occured');
					});
			} else {
				console.log('uploadVolume failed');
				setButtonMessage('Error');
			}
		});
	};

	// called whenever the popup opens
	useEffect(() => {
		chrome.tabs.query({ audible: true }, (queryResult) => {
			console.log('popup useEffect called. queryResult: ' + queryResult);
			setAudibleTabs(queryResult);
		});
		// const setInitialVolume = async () => {
		// 	setVolume((await getVolume()) * 100);
		// };
		// setInitialVolume();
		getVolume();
		console.log('useEffect volme: ' + volume);
	}, []);

	// useEffect(() => {
	// 	updateVolume();
	// }, [volume]);

	return (
		<div className='App'>
			<header className='App-header'>
				<div className='title'>
					<img
						style={{ height: '30px', width: '30px', paddingRight: '12px' }}
						src={'./icon.png'}
					/>
					<p style={{ fontSize: '18px' }}>VOLUME ADAPT</p>
				</div>
				<hr
					style={{
						color: '#9ba4b4',
						width: '80%',
						border: '1px solid #0f4c75',
					}}
				/>
				<p>Current tab volume</p>
				<div className='volume-control'>
					<VolumeDown />
					<Slider
						classes={{
							...sliderClasses,
						}}
						value={volume}
						max={200}
						onChange={handleSliderChange}
						aria-labelledby='continuous-slider-custom'
						valueLabelDisplay='auto'
						marks={retrievedValue}
					/>
					<VolumeUp />
				</div>
				{retrievedValue.length === 0 && (
					<div>
						<FontAwesomeIcon icon={'exclamation-triangle'} />

						<p style={{ fontSize: '13px' }}>No volume data found</p>
					</div>
				)}

				<Button
					classes={{ ...buttonClasses }}
					disabled={retrievedValue.value === volume}
					onClick={uploadVolume}>
					{buttonMessage}
				</Button>
				<div className='audible-list'>
					<p>Tabs playing audio</p>
					{typeof audibleTabs !== 'undefined' &&
						audibleTabs.map((tab) => {
							console.log('audibleTabs map running. current tab: ' + tab);
							return (
								<div className='audible-item'>
									<img src={tab['favIconUrl']} />
									<p
										onClick={() =>
											chrome.tabs.update(tab['id'], { active: true })
										}>
										{tab['title'].substring(0, 30)}..
									</p>
								</div>
							);
						})}
				</div>
			</header>
		</div>
	);
};

export default App;
