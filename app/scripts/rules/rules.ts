export interface Rules {
	comments?: string
	urlPattern: string
	replyUrl: string
	rules: Rule[]
}

export interface Rule {
	messageExactMatch?: string
	messagePattern?: string
	regexFlags?: string

	/** A random item from this list will be selected. */
	responses: string[]
}

export interface RulesSettings {
	dateModified: Date
	apps: Rules[]
}

export function checkRules(rules: RulesSettings): void {
	if (typeof rules !== 'object') {
		throw new Error("rules must be an object.")
	}
}
