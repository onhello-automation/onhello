import { browser } from 'webextension-polyfill-ts'
import { APP_DEFAULTS, DEFAULT_RULES, RulesSettings } from './rules'

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
