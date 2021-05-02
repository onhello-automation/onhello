import { PaletteType } from '@material-ui/core'
import { browser } from 'webextension-polyfill-ts'
import { getRules } from './rules/get_rules'

export type ThemePreferenceType = PaletteType | 'device'

export interface UserSettings {
	themePreference: ThemePreferenceType
	rules: string
}

export async function setupUserSettings(requiredKeys: (keyof (UserSettings))[]): Promise<Partial<UserSettings>> {
	const keys: Partial<UserSettings> = {
		themePreference: undefined,
	}
	const results = await browser.storage.local.get(keys)
	let { themePreference } = results
	if (requiredKeys.indexOf('themePreference') > - 1 && themePreference === undefined) {
		const r = await browser.storage.sync.get(['themePreference'])
		themePreference = r.themePreference
		if (themePreference !== undefined) {
			browser.storage.local.set({ themePreference })
		} else {
			themePreference = 'device'
		}
	}
	const result: any = { themePreference }

	if (requiredKeys.indexOf('rules') > -1) {
		// browser.storage.local.remove('rules')
		// browser.storage.sync.remove('rules')
		result.rules = await getRules()
	}

	return result
}
