# Volume Adapt

Chrome extension that allows the user to adjust the voume of
different tabs individually, as well as navigate through different
tabs playing audio.\
Users are able to contribute to crowd-sourcing
an optimal volume for videos, by submitting their volume to the
database, which is then used to suggest an appropriate volume for
videos upon opening a new one.

## Chrome Extension

[Download here](https://chrome.google.com/webstore/detail/volume-adapt/dicnjoljhecfbjjndjeiepcdefelncmj)

## Preview

![preview](/src/image/volume-adapt-preview.gif)

## How to use

![preview](/src/image/image1.png)

The extension works on per-tab basis, and will only start working once you activate the extension by clicking on it. After that, you can browse with the extension running in the background.

### Retrieving volume

Once the extension has been activated, the extension will retrieve the average volume from the database and set the default slider to said volume upon opening a new Youtube video.\
The preset volume will have a grey mark on the slider, and if there isn't one available, the slider will simply default to 100%

### Submitting volume

You can submit what you think an ideal volume is for the video, by adjusting it yourself using the slider, and pressing the submit button. The data is then sent to the backend for it to be combined with the existing data, if there is one.
