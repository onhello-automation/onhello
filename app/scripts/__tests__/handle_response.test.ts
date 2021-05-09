import { expect } from 'chai'
import { handleResponse } from '../handle_response'
import { Rules } from '../rules/rules'

describe('handle_response', () => {
	it('handleResponse for Teams', async () => {
		const senderUuid = '953a4537-5098-4e30-b6f2-c97b37b647eb'
		const senderName = "First Last"
		const currentUserUuid = '0b98bbd1-5ee5-433d-9414-474f470c711f'
		const anotherUuid = '1639ef5c-a7a2-41a2-a1ac-0dc252a1b03e'
		const url = `https://eastus2.notifications.teams.microsoft.com/users/8:orgid:${currentUserUuid}/endpoints/${anotherUuid}/events/poll`
		const from = `https://notifications.skype.net/v1/users/ME/contacts/8:orgid:${senderUuid}`
		const messageText = "Hi"
		async function sendMethod(imdisplayname: string): Promise<void> {
			expect(imdisplayname).to.equal(senderName)
		}
		const rules = {
			name: 'teams',
			// Don't put the values from APP_DEFAULTS because we might want to change them for everyone in an update
			// and that can't be done if the user saves explicit values for them.
			rules: [
				{
					messageExactMatch: messageText,
					responses: ["Hey"]
				}
			]
		} as Rules
		const result = await handleResponse(url, {
			eventMessages: [{
				resourceType: 'NewMessage',
				type: 'EventMessage',
				resource: {
					composetime: new Date().toString(),
					from,
					imdisplayname: senderName,
					to: currentUserUuid,
					messagetype: 'Text',
					contenttype: 'text',
					content: messageText,
				},
			}],
		}, {}, rules, sendMethod)
		expect(result).to.not.be.undefined
		if (result) {
			expect(result.matches).to.have.lengthOf(1)
			const match = result.matches[0]
			expect(match.from).to.equal(senderName)
			expect(match.messageText).to.equal(messageText)
			expect(match.toId).to.equal(currentUserUuid)
			expect(match.response).to.not.be.undefined
			if (match.response) {
				expect(match.response.messageType).to.equal('RichText/Html')
				expect(match.response.text).to.equal("Hey")
			}
		}
	})
})