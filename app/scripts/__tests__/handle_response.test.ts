import { assert } from 'chai'
import { replaceResponseText } from '../handle_response'

describe('handle_response', () => {
	it('replaceResponseText', () => {
		assert.equal(replaceResponseText("Hey", "John Smith"), "Hey")
		assert.equal(replaceResponseText("Hey {{ FROM }}", "John Smith"), "Hey John Smith")
		assert.equal(replaceResponseText("Hey {{ FROM_FIRST_NAME }}", "John Smith"), "Hey John")
	})
})