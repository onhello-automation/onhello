export type AppName = 'teams'

/**
 * The object representing all of the user's rules.
 */
export interface RulesSettings {
	/** The apps and rules for which the user has rules. */
	apps: Rules[]
	/** When the rules were last modified. */
	dateModified?: Date
	// TODO Support global rules to run AFTER app specific rules.
	// They will run AFTER app specific rules so that they can easily be overriden for specific apps.
	// globalRules: Rule[]
}

/**
 * The rules for an app.
 * Many fields have defaults that can be retrieved based on the app name.
 */
export interface Rules extends Partial<AppDefaults> {
	/**
	 * An identifier for the application.
	 * This name will be used to retrieve default values for other fields without provided values.
	 * Only Microsoft Teams ('teams') is fully supported for now.
	 */
	name: AppName
	/**
	 * The rules to check when a message comes in that matches the URL pattern and other filters.
	 */
	rules: Rule[]
}

/**
 * A rule to respond to a message.
 */
export interface Rule {
	/**
	 * This rule triggers if the message text is exactly the same as the value for this field.
	 */
	messageExactMatch?: string
	/**
	 * This rule triggers if the message text matches this regex pattern.
	 * A JavaScript regex is created and `Regex.test` is used to check for a match.
	 */
	messagePattern?: string
	/**
	 * The flags for {@link messagePattern}.
	 */
	regexFlags?: string

	// TODO Add time range of when to respond.
	// TODO Add message age limit.

	/**
	 * If this rule matches the message, then
	 * a random item from this list will be selected as the response.
	 * Placeholders such as `{{ FROM }}` and `{{ FROM_FIRST_NAME }}` can be given as explained in the Options page.
	 */
	responses: string[]
}

/**
 * An object for defaults to supply for values in {@link Rules} when values are missing.
 */
export interface AppDefaults {
	/**
	 * A regex pattern to match the URL of polling request to get more messages.
	 */
	urlPattern: string
	/**
	 * The JSON path for the events in the response body of the polling request.
	 */
	eventsPath: string
	/**
	 * Mainly for Microsot Teams.
	 * The path in the response event to a URL value that helps detect who a message came from.
	 */
	eventFromUrlPath: string
	/**
	 * The path in the response event to when the message was composed.
	 */
	eventComposeTimePath: string
	/**
	 * The path in the response event to the display name of the message sender.
	 */
	eventDisplayNamePath: string
	/**
	 * The path in the response event to the ID of who the message is being sent to.
	 */
	eventToIdPath: string
	/**
	 * The path in the response event to the message's text.
	 */
	eventMessageTextPath: string
	/**
	 * The URL to use to reply to a message.
	 * This can have placeholders.
	 * Supported placeholder:
	 * * `{{toId}}`: retrieved using {@link eventToIdPath}.
	 */
	replyUrl: string
}

/**
 * Defaults to supply when the user doesn't set them.
 */
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
			if (val !== undefined && (app as any)[key] === undefined) {
				(app as any)[key] = val
			}
		}
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
