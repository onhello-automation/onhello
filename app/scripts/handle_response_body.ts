import { Rule, Rules, RulesSettings } from './rules/rules'

export async function handleResponse(url: string, responseBody: any, requestHeaders: any, settings: Rules) {
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
					console.debug(`onhello: Got \"${messageText}\" from \"${from}\".`)
					const response = getResponse(from, messageText, settings.rules)
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

export class Response {
	constructor(
		public text: string,
		public messageType: 'Text' | 'RichText/Html' = 'Text') { }
}

export function replaceResponseText(text: string, from: string): string {
	const firstName = (from || "").split(/\s+/)[0]
	let result = text.replace(/{{\s*FROM_FIRST_NAME\s*}}/g, firstName)
	result = result.replace(/{{\s*FROM\s*}}/g, from)
	return result
}

export function getResponse(from: string, messageText: string, rules: Rule[]): Response | undefined {
	for (const rule of rules) {
		// console.debug("onhello: Checking rule:", rule)
		if (rule.messageExactMatch === messageText
			|| (rule.messagePattern !== undefined
				&& new RegExp(rule.messagePattern, rule.regexFlags).test(messageText))) {
			if (!Array.isArray(rule.responses) || rule.responses.length === 0) {
				console.warn("onhello: There are no responses set for rule:", rule)
			}
			// Pick a random response.
			let responseText = rule.responses[Math.floor(rule.responses.length * Math.random())]
			responseText = replaceResponseText(responseText, from)
			return new Response(responseText, 'RichText/Html')
		}
	}
	return undefined
}

function sendMessage(imdisplayname: string, response: Response, toId: string, requestHeaders: any, settings: Rules) {
	console.debug(`onhello/sendMessage: Replying \"${response.text}\" to \"${imdisplayname}\".`)
	// This was built using by watching request in the Network tab on the browser's DevTools.
	let url = settings.replyUrl
	url = url.replace(/{{toId}}/g, toId)

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