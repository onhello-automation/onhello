export type AppName = 'teams'

export interface RulesSettings {
	dateModified: Date
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
