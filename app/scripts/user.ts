import { PaletteType } from '@material-ui/core'
import { browser } from 'webextension-polyfill-ts'
import { DEFAULT_RULES } from './rules/get_rules'

export type ThemePreferenceType = PaletteType | 'device'

export interface UserSettings {
	themePreference: ThemePreferenceType
	rules: string
}

export async function setupUserSettings(requiredKeys: (keyof (UserSettings))[]): Promise<UserSettings> {
	const keys: Partial<UserSettings> = {
		themePreference: undefined,
		rules: undefined,
	}
	const results = await browser.storage.local.get(keys)
	let { themePreference, rules } = results
	if (requiredKeys.indexOf('themePreference') > - 1 && themePreference === undefined) {
		const r = await browser.storage.sync.get(['themePreference'])
		themePreference = r.themePreference
		if (themePreference !== undefined) {
			browser.storage.local.set({ themePreference })
		} else {
			themePreference = 'device'
		}
	}
	const result: any = { themePreference, rules }

	if (requiredKeys.indexOf('rules') > -1 && rules === undefined) {
		// browser.storage.local.remove('rules')
		// browser.storage.sync.remove('rules')
		const r = await browser.storage.sync.get(['rules'])
		rules = r.rules
		if (rules === undefined) {
			rules = DEFAULT_RULES
		} else {
			browser.storage.local.set({ rules })
		}
		result.rules = rules
	}

	return result
}
