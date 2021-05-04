# onhello

Automatically reply to messages in Teams (and soon other platforms).

# Download
You can download the extension for various browsers:
* [Chrome/Brave/Edge](https://chrome.google.com/webstore/detail/onhello/dljknoapaelicknjmjihiaigbnhcpikm)

# How does it work?
1. The extension injects code into certain webpages (for example, https://teams.microsoft.com/, you can see the full list in the [manifest](app/manifest.json) file).
2. This code watches for web requests to URLs matching a certain pattern.
You can customize this pattern if you find that the extension isn't working.
3. When a matching URL is found, the response is parsed and the relevant fields such as the message sender and text are extracted.
This extraction is not configurable yet but it soon will be so that this extension is more robust and can work for other messaging platforms.
5. The code checks your custom rules to find the first one that matches the text.
6. If a rule matches, your reply is randomly picked from one the possible responses.
7. If your reply has placeholders (for example `{{ FROM_FIRST_NAME }}`), then they get filled in.
8. A new web request is made to the `replyUrl`.
A default for Teams has been set up but you can change it if you find that the extension isn't working.


# Development
Here are some development notes if you would like to contribute to the extension.
This was built using [webextension-toolbox](https://github.com/HaNdTriX/webextension-toolbox).

## Install

    yarn install

## Development
Run:

    yarn dev chrome

Other options might build but as of May 2021, Teams isn't supported in other browsers.

## Build
Run:

    yarn build chrome

## Installing in the browser
Load the `dist/<browser>` folder as an unpacked extension in your browser.
