import { browser } from 'webextension-polyfill-ts'
import { APP_DEFAULTS, RulesSettings } from './rules'

/**
 * The rules that will be used if the user never set any up.
 */
export const DEFAULT_RULES: RulesSettings = {
	dateModified: new Date(),
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
			]
		},
	]
}

export async function getRules(): Promise<RulesSettings> {
	const [localRules, syncedRules] = await Promise.all([
		browser.storage.local.get('rules'),
		browser.storage.sync.get('rules'),
	])
	let result: RulesSettings
	if (localRules.rules === undefined || syncedRules.rules === undefined) {
		result = DEFAULT_RULES
	} else if (localRules.rules.dateModified === undefined) {
		result = syncedRules.rules
	} else if (syncedRules.rules.dateModified === undefined) {
		result = localRules.rules
	} else if (new Date(syncedRules.rules.dateModified) > new Date(localRules.rules.dateModified)) {
		result = syncedRules.rules
	} else {
		result = localRules.rules
	}

	return result
}

export function applyDefaults(rules: RulesSettings): void {
	for (const app of rules.apps) {
		const defaults = APP_DEFAULTS[app.name]
		if (!app.replyUrl) {
			app.replyUrl = defaults.replyUrl
		}
		if (!app.urlPattern) {
			app.urlPattern = defaults.urlPattern
		}
	}
}
