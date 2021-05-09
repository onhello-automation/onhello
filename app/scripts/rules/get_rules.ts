import { browser } from 'webextension-polyfill-ts'
import { APP_DEFAULTS, DEFAULT_RULES, RulesSettings } from './rules'

export async function getRules(): Promise<RulesSettings> {
	const [{ localRules }, { syncedRules }] = await Promise.all([
		browser.storage.local.get('rules'),
		browser.storage.sync.get('rules'),
	])
	let result: RulesSettings
	if (localRules === undefined && syncedRules === undefined) {
		result = DEFAULT_RULES
	} else if (localRules === undefined || localRules.dateModified === undefined) {
		// console.debug("syncedRules.dateModified:", syncedRules.dateModified)
		result = syncedRules
	} else if (syncedRules === undefined || syncedRules.dateModified === undefined) {
		// console.debug("localRules.dateModified:", localRules.dateModified)
		result = localRules
	} else if (new Date(syncedRules.dateModified) > new Date(localRules.dateModified)) {
		result = syncedRules
	} else {
		result = localRules
	}

	if (typeof result.dateModified === 'string') {
		result.dateModified = new Date(result.dateModified)
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
