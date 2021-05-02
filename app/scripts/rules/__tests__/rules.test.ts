import { checkRules, DEFAULT_RULES } from '../rules'

describe('rules', () => {
	it('default rules', () => {
		checkRules(DEFAULT_RULES)
	})
})