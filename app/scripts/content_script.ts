import { browser } from 'webextension-polyfill-ts'
import { getRules } from './rules/get_rules'

getRules().then(rules => {
	// I tried so many ways to get the rules into the page, this seems like one of the only ways because
	// you can't access storage directly in the injected script.
	const rulesScript = document.createElement('script')
	// Add extra escaping to help with escaping quotes and backslashes properly.
	const rulesString = JSON.stringify(JSON.stringify(rules))
	rulesScript.textContent = `window._onhelloRules = JSON.parse(${rulesString});`;

	(document.head || document.documentElement).appendChild(rulesScript)

	const s = document.createElement('script')
	s.src = browser.extension.getURL('scripts/injected.js')
	s.onload = async function () {
		(this as any).remove()
	};
	(document.head || document.documentElement).appendChild(s)
})
