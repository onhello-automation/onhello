import jsonpath from 'jsonpath'
import { getResponse, Response } from './response'
import { Rule, Rules } from './rules/rules'

declare global {
	interface Window {
		_onhelloGetResponse: (from: string, messageText: string, rules: Rule[]) => Response
		_onhelloHandleResponse: (url: string, responseBody: any, requestHeaders: any, settings: Rules) => Promise<void>
	}
}

export interface HandleResponseMatch {
	from: string
	messageText: string
	toId: string
	response?: Response
}

export interface HandleResponseResult {
	matches: HandleResponseMatch[]
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function handleResponse(url: string, responseBody: any, requestHeaders: any, settings: Rules, sendMethod = sendMessage): Promise<HandleResponseResult | undefined> {
	if (window._onhelloHandleResponse) {
		window._onhelloHandleResponse(url, responseBody, requestHeaders, settings)
		return
	}

	const result: HandleResponseResult = {
		matches: []
	}
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	jsonpath.query(responseBody, settings.eventsPath!).forEach(event => {
		// console.debug("onhello: handle: event:", event, requestHeaders)
		if (settings.eventFromUrlPath) {
			const from = jsonpath.value(event, settings.eventFromUrlPath)
			if (from && isFromCurrentUser(from, url)) {
				return
			}
		}

		if (settings.eventComposeTimePath) {
			const composeTime = jsonpath.value(event, settings.eventComposeTimePath)
			if (composeTime) {
				// Check if it was sent in the last 1 minute.
				if (new Date().getTime() - new Date(composeTime).getTime() > 60 * 1000) {
					return
				}
			}
		}

		let from = undefined,
			toId = undefined
		if (settings.eventDisplayNamePath) {
			from = jsonpath.value(event, settings.eventDisplayNamePath)
		}
		if (settings.eventToIdPath) {
			toId = jsonpath.value(event, settings.eventToIdPath)
		}

		// Mainly built to handle a Teams response.	
		// Eventually the rules will have JSON paths to know how to handle messages for different sites.
		let { resource } = event
		if (resource.lastMessage) {
			resource = resource.lastMessage
		}
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let messageText = jsonpath.value(event, settings.eventMessageTextPath!)
		// console.debug("messageText:", messageText)
		// Other types: messagetype: "Control/Typing", contenttype: "Application/Message"
		if (resource.messagetype === 'Text' && resource.contenttype === 'text') {
			// messageText = resource.content
		} else if (resource.messagetype === 'RichText/Html' && resource.contenttype === 'text') {
			// messageText = resource.content
			if (messageText) {
				// Get rid of HTML tags.
				// There are fancier ways to do this but they can cause issues if they try to render themselves.
				messageText = messageText.replace(/<[^>]+>/g, '')
			}
		} else {
			messageText = undefined
		}
		if (messageText) {
			console.debug(`onhello: Got "${messageText}" from "${from}".`)
			let response: Response | undefined
			if (window._onhelloGetResponse) {
				response = window._onhelloGetResponse(from, messageText, settings.rules)
			} else {
				response = getResponse(from, messageText, settings.rules)
			}
			if (response) {
				sendMethod(from, response, toId, requestHeaders, settings)
			}
			result.matches.push({
				from,
				messageText,
				toId,
				response,
			})
		}
	})
	return result
}

/**
 * 
 * @param from The value for the "from" key in the event.
 * @param url The URL for the request.
 * @returns `true` if the message came from the current user.
 */
export function isFromCurrentUser(from: string, url: string): boolean {
	// from is like "https://notifications.skype.net/v1/users/ME/contacts/8:orgid:{{sender's user's UUID}}"
	// url is like "https://eastus2.notifications.teams.microsoft.com/users/8:orgid:{{current user's UUID}}/endpoints/{{a UUID, maybe for the tenant? }}/events/poll"
	const m = /[a-z0-9-]+$/i.exec(from)
	if (m) {
		const uuid = m[0]
		return url.indexOf(uuid) > 10
	}

	console.warn("onhello: Couldn't get the current user's ID.")
	return false
}

function sendMessage(imdisplayname: string, response: Response, toId: string, requestHeaders: any, settings: Rules): Promise<any> {
	console.debug(`onhello/sendMessage: Replying "${response.text}" to "${imdisplayname}".`)
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	let url = settings.replyUrl!
	url = url.replace(/{{toId}}/g, toId)

	// This was built using by watching request in the Network tab on the browser's DevTools.
	const body = {
		content: response.text,
		messagetype: response.messageType,
		contenttype: 'text',
		amsreferences: [],
		clientmessageid: `${new Date().getTime()}${Math.floor(Math.random() * 1E4)}`,
		// This should be set to the sender's display name but I don't see a stateless way to get it.
		// imdisplayname: onhelloId,
		properties: {
			importance: "",
			subject: null
		}
	}
	// Could look into retrieving some fields from other messages so that this can be automatically updated.
	return fetch(url, {
		headers: {
			accept: 'json',
			'accept-language': "en-US,en;q=0.9",
			authentication: requestHeaders.Authentication,
			behavioroverride: requestHeaders.BehaviorOverride,
			clientinfo: requestHeaders.ClientInfo,
			'content-type': 'application/json',
			"sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"90\", \"Microsoft Edge\";v=\"90\"",
			'sec-ch-ua-mobile': '?0',
			'sec-fetch-dest': 'empty',
			'sec-fetch-mode': 'cors',
			'sec-fetch-site': 'same-origin',
			'x-ms-client-env': requestHeaders['x-ms-client-env'],
			'x-ms-client-type': requestHeaders['x-ms-client-type'],
			'x-ms-client-version': requestHeaders['x-ms-client-version'],
			'x-ms-scenario-id': requestHeaders['x-ms-scenario-id'],
			'x-ms-session-id': requestHeaders['x-ms-session-id'],
			'x-ms-user-type': requestHeaders['x-ms-user-type'],
		},
		// Maybe it could also be teams.live.com? Seems like it's not needed.
		// referrer: 'https://teams.microsoft.com/_',
		referrerPolicy: 'strict-origin-when-cross-origin',
		body: JSON.stringify(body),
		method: 'POST',
		mode: 'cors',
		credentials: 'include'
	})
}