import { browser } from 'webextension-polyfill-ts'

// Inspired by https://stackoverflow.com/a/56429696/1226799
// document.querySelectorAll('[data-i18n]').forEach(e => {
// 	const el = e as HTMLElement
// 	const text = getMessage(el.dataset.i18n!)
// 	if (text) {
// 		el.innerText = text
// 	} else {
// 		console.warn(`No message found for "${el.dataset.i18n}".`)
// 	}
// })

export function getMessage(key: string) {
	return browser.i18n.getMessage(key)
}