import { browser } from 'webextension-polyfill-ts'
import { RulesSettings } from './rules'

export const DEFAULT_RULES: RulesSettings = {
	dateModified: new Date(),
	apps: [
		{
			comments: "For Microsoft Teams",
			urlPattern: '/poll$',
			replyUrl: "https://teams.microsoft.com/api/chatsvc/amer/v1/users/ME/conversations/{{toId}}/messages",
			// TODO Add JSON paths of where to get the message, sender name, etc.
			// TODO Add time range of when to respond.
			// TODO Add message age limit.
			rules: [
				{
					messageExactMatch: "Hi",
					responses: ["Hey, what's up?", "Hi, how are you?"]
				},
				{
					messageExactMatch: "Good morning",
					responses: ["Good morning {{ FROM }}, what's up?"]
				},
				{
					messagePattern: '^(hello|hey|hi|good (morning|evening|afternoon))\\b.{0,12}$',
					regexFlags: 'i',
					responses: ["🤖 <em>This is an automated response:</em> Hey {{ FROM_FIRST_NAME }}, what's up?"]
				},
			]
		},
	]
}

export async function getRules(): Promise<RulesSettings | undefined> {
	let { rules } = await browser.storage.local.get('rules')
	if (rules === undefined) {
		const results = await browser.storage.sync.get('rules')
		if (results === undefined || results.rules === undefined) {
			console.debug("onhello: no rules found. Using default rules.")
			return DEFAULT_RULES
		}
		rules = results.rules
	}
	return rules
}