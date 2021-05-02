import { getResponse, Response } from './response'
import { APP_DEFAULTS, Rule, Rules } from './rules/rules'

declare global {
	interface Window {
		_onhelloGetResponse: (from: string, messageText: string, rules: Rule[]) => Response
		_onhelloHandleResponse: (url: string, responseBody: any, requestHeaders: any, settings: Rules) => Promise<void>
	}
}

export async function handleResponse(url: string, responseBody: any, requestHeaders: any, settings: Rules): Promise<void> {
	if (window._onhelloHandleResponse) {
		window._onhelloHandleResponse(url, responseBody, requestHeaders, settings)
		return
	}
	// Handle Teams response.
	// Eventually the rules will have JSON paths to know how to handle messages for different sites.
	if (responseBody && Array.isArray(responseBody.eventMessages) && responseBody.eventMessages.length > 0) {
		for (const event of responseBody.eventMessages) {
			// console.debug("onhello: handle: event:", event, requestHeaders)
			if (event.type === 'EventMessage' && event.resource && event.resourceType === 'NewMessage') {
				let { resource } = event
				if (resource.lastMessage) {
					resource = resource.lastMessage
				}

				if (isFromCurrentUser(resource.from, url)) {
					continue
				}
				if (resource.composetime) {
					const sentTime = new Date(resource.composetime)
					// Check if it was sent in the last 1 minute.
					if (new Date().getTime() - sentTime.getTime() > 60 * 1000) {
						continue
					}
				}
				// const receivedTime = resource.originalarrivaltime
				const from = resource.imdisplayname
				const toId = resource.to
				let messageText
				// Other types: messagetype: "Control/Typing", contenttype: "Application/Message"
				if (resource.messagetype === 'Text' && resource.contenttype === 'text') {
					messageText = resource.content
				} else if (resource.messagetype === 'RichText/Html' && resource.contenttype === 'text') {
					messageText = resource.content
					if (messageText) {
						// Get rid of HTML tags.
						// There are fancier ways to do this but they can cause issues if they try to render themselves.
						messageText = messageText.replace(/<[^>]+>/g, '')
					}
				}
				if (messageText) {
					console.debug(`onhello: Got "${messageText}" from "${from}".`)
					let response
					if (window._onhelloGetResponse) {
						response = window._onhelloGetResponse(from, messageText, settings.rules)
					} else {
						response = getResponse(from, messageText, settings.rules)
					}
					if (response) {
						sendMessage(from, response, toId, requestHeaders, settings)
					}
				}
			}
		}
	}
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
	// Shouldn't need the defaults here because the value should already get applied.
	let url = settings.replyUrl || APP_DEFAULTS[settings.name].replyUrl
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