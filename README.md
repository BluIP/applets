# Open-source Applets for Auxiliary platform.

What it gives you:

 * Easy access to Broadsoft XSI Actions & Events
 * User Preferences
 * Javascript Framework

## Directory Requirements

 * app.js
 * index.html
 * logo.svg
 * manifest.json

## manifest.json

```json
{
	"title": "New",
	"description": "My new applet.",
	"version": "1.0.0",
	"group": "tools",
	"icon": "fa fa-phone",
	"logo": "/api/applet/logo.svg",
	"runtime": "/api/applet/app.js",
	"routes": [{
		"scrollable": true,
		"stickable": true,
		"target": "_auxiliary",
		"templateUrl": "/api/applet/",
		"title": "New",
		"type": "Template",
		"url": "/new"
	}],
	"stickable": true,
	"tags": [
		"buddies",
		"friends",
		"blf"
	]
}
```

## APPLET INSTALLATION

1. Download the repo and pick an applet to use as your base.
2. Change the "title" within the manifest.json. (The applet's title is unique and CANNOT be changed.)
3. Drag and drop your applet directory into [beta.bluip.io/#/applets](https://beta.bluip.io/#/applets) to register.
4. Ensure that your file paths are accessible (remote or local).

## MUST

All HTTP requests must be HTTPS.

## WEBSITES

 * Use [dev.redial.io](http://dev.redial.io) to develop locally (MAMP).

 * Use [beta.redial.io](https://beta.bluip.io) for the latest experience.
