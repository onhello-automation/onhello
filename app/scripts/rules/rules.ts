export type AppName = 'teams'

export interface RulesSettings {
	dateModified?: Date
	apps: Rules[]
	// TODO Support global rules to run AFTER app specific rules.
	// globalRules: Rule[]
}

export interface AppDefaults {
	urlPattern: string
	eventsPath: string
	eventFromUrlPath?: string
	eventComposeTimePath?: string
	eventDisplayNamePath?: string
	eventToIdPath?: string
	eventMessageTextPath?: string
	replyUrl: string
}

export interface Rules {
	/**
	 * An identifier for the application.
	 * Only Microsoft Teams is supported for now.
	 */
	name: AppName
	urlPattern?: string
	/**
	 * The JSON path for the events in the response body.
	 */
	eventsPath?: string
	/**
	 * Mainly for Teams.
	 * Helps detect who a message came from.
	 */
	eventFromUrlPath?: string
	eventComposeTimePath?: string
	eventDisplayNamePath?: string
	eventToIdPath?: string
	eventMessageTextPath?: string
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
		urlPattern: '^https://.*teams.(microsoft|live).com/.*/poll$',
		eventsPath: '$.eventMessages[?(@.type==\'EventMessage\' && @.resourceType==\'NewMessage\')]',
		eventFromUrlPath: '$.resource..from',
		eventComposeTimePath: '$.resource..composetime',
		eventDisplayNamePath: '$.resource..imdisplayname',
		eventToIdPath: '$.resource..to',
		eventMessageTextPath: '$.resource..content',
		replyUrl: 'https://teams.microsoft.com/api/chatsvc/amer/v1/users/ME/conversations/{{toId}}/messages',
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
					messagePattern: '^how did you respond so (fast|quickly)\\?',
					regexFlags: 'i',
					responses: ["I'm using <a href=\"https://github.com/onhello-automation/onhello\">onhello</a>!"]
				},
			]
		},
	]
}

export function applyDefaults(rules: RulesSettings): void {
	for (const app of rules.apps) {
		const defaults = APP_DEFAULTS[app.name]
		for (const [key, val] of Object.entries(defaults)) {
			if ((app as any)[key] === undefined && val !== undefined) {
				(app as any)[key] = val
			}
		}
		// if (!app.replyUrl) {
		// 	app.replyUrl = defaults.replyUrl
		// }
		// if (!app.eventsPath) {
		// 	app.eventsPath = defaults.eventsPath
		// }
		// if (!app.urlPattern) {
		// 	app.urlPattern = defaults.urlPattern
		// }
	}
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
