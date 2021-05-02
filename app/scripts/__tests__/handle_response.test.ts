import { expect } from 'chai'
import { replaceResponseText } from '../response'

describe('handle_response', () => {
	it('replaceResponseText', () => {
		expect(replaceResponseText("Hey", "John Smith")).to.equal("Hey")
		expect(replaceResponseText("Hey {{ FROM }}", "John Smith")).to.equal("Hey John Smith")
		expect(replaceResponseText("Hey {{ FROM_FIRST_NAME }}", "John Smith")).to.equal("Hey John")
	})
})