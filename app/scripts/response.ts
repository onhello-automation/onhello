import { Rule } from "./rules/rules"

export class Response {
	constructor(
		public text: string,
		public messageType: 'Text' | 'RichText/Html' = 'Text') { }
}

export function replaceResponseText(text: string, from: string): string {
	const firstName = (from || "").split(/\s+/)[0]
	let result = text.replace(/{{\s*FROM_FIRST_NAME\s*}}/g, firstName)
	result = result.replace(/{{\s*FROM\s*}}/g, from)
	return result
}

export function getResponse(from: string, messageText: string, rules: Rule[]): Response | undefined {
	for (const rule of rules) {
		// console.debug("onhello: Checking rule:", rule)
		if (rule.messageExactMatch === messageText
			|| (rule.messagePattern !== undefined
				&& new RegExp(rule.messagePattern, rule.regexFlags).test(messageText))) {
			if (!Array.isArray(rule.responses) || rule.responses.length === 0) {
				console.warn("onhello: There are no responses set for rule:", rule)
			}
			// Pick a random response.
			let responseText = rule.responses[Math.floor(rule.responses.length * Math.random())]
			responseText = replaceResponseText(responseText, from)
			return new Response(responseText, 'RichText/Html')
		}
	}
	return undefined
}