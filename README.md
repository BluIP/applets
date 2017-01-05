# Open-source Applets for the Dialer v4

What it gives you:

 * Easy access to Broadsoft XSI-Actions
 * User Preferences
 * AngularJS & Ionic 1.0 Framework

## Directory Requirements

 * app.js
 * index.html
 * logo.svg
 * manifest.json
 * settings.html

## manifest.json

```json
{
	"title": "My Applet",
	"description": "An app that we created.",
	"version": "2.0.0",
	"changelog": [
		"Something new!"
	],
	"runtime": "app.js",
	"options_page": "settings.html",
	"routes": [{
		"title": "Money Maker",
		"icon": "logo.svg",
		"up": "app",
		"views": {
			"menuContent": {
				"template": "index.html"
			}
		},
		"show": "session",
		"tags": ["sales", "dial"]
	}]
}
```

## MUST

When making 3rd party HTTP requests, insure they're to a HTTPS hosts.


## WEBSITES

 * Use [dev.redial.io](http://dev.redial.io) to develop locally.
 * Here's some [documentation](http://docs.redial.io/m/63341).
