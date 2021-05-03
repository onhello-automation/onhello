export type AppName = 'teams'

export interface RulesSettings {
	dateModified?: Date
	apps: Rules[]
}

export interface AppDefaults {
	urlPattern: string
	replyUrl: string
}

export interface Rules {
	/**
	 * An identifier for the application.
	 * Only Microsoft Teams is supported for now.
	 */
	name: AppName
	urlPattern?: string
	replyUrl?: string
	rules: Rule[]
}

export interface Rule {
	messageExactMatch?: string
	messagePattern?: string
	regexFlags?: string

	// TODO Add time range of when to respond.
	// TODO Add message age limit.

	/** A random item from this list will be selected. */
	responses: string[]
}

export const APP_DEFAULTS: { [app: string]: AppDefaults } = {
	teams: {
		urlPattern: '/poll$',
		replyUrl: "https://teams.microsoft.com/api/chatsvc/amer/v1/users/ME/conversations/{{toId}}/messages",
		// TODO Add JSON paths of where to get the message, sender name, etc.
	}
}

/**
 * The rules that will be used if the user never set any up.
 */
export const DEFAULT_RULES: RulesSettings = {
	apps: [
		{
			name: 'teams',
			// Don't put the values from APP_DEFAULTS because we might want to change them for everyone in an update
			// and that can't be done if the user saves explicit values for them.
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
				{
					messagePattern: '^how did respond so (fast|quickly)\\?',
					regexFlags: 'i',
					responses: ["I'm using <a href=\"https://github.com/onhello-automation/onhello\">onhello</a>!"]
				},
			]
		},
	]
}

export function checkRules(rules: RulesSettings): void {
	if (typeof rules !== 'object') {
		throw new Error("rules must be an object.")
	}
	if (!Array.isArray(rules.apps)) {
		throw new Error("No list of apps was found.")
	}

	for (const app of rules.apps) {
		if (!Array.isArray(app.rules)) {
			throw new Error(`No rules list found in app: ${JSON.stringify(app)}`)
		}

		for (const rule of app.rules) {
			if (rule.messageExactMatch === undefined && rule.messagePattern === undefined) {
				throw new Error(`No check found for ${JSON.stringify(rule)}`)
			}

			if (!Array.isArray(rule.responses) || rule.responses.length === 0) {
				throw new Error(`No responses list for ${JSON.stringify(rule)}`)
			}

			for (const response of rule.responses) {
				if (typeof response !== 'string') {
					throw new Error(`Each response must be a string. Got: ${JSON.stringify(response)}`)
				}
			}
		}
	}
}
