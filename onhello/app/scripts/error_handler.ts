import { browser } from 'webextension-polyfill-ts'

export interface ShowErrorInput {
	serviceError: any | undefined
	errorMsg: string | undefined
	clearAfterMs: number | undefined
}

export class ErrorHandler {
	private lastTimeout: number | undefined

	/**
	 * @param errorTextElement The location where to display the error. If not given, the error will be alerted.
	 */
	constructor(private errorTextElement: HTMLElement | undefined | null = undefined) {
	}

	showError(input: Partial<ShowErrorInput> | any) {
		const { serviceError, clearAfterMs } = input
		let { errorMsg } = input
		if (typeof errorMsg === 'string' && errorMsg) {
		} else if (typeof serviceError === 'string' && !errorMsg) {
			errorMsg = serviceError
		} else if (serviceError !== undefined && serviceError.responseJSON && serviceError!.responseJSON.error) {
			const { errorCode, message } = serviceError.responseJSON.error
			errorMsg = browser.i18n.getMessage(`errorCode_${errorCode}`) || message
		} else if (typeof input !== 'string') {
			errorMsg = JSON.stringify(input)
		} else {
			errorMsg = input
		}
		console.error(errorMsg)
		if (this.errorTextElement && errorMsg) {
			clearTimeout(this.lastTimeout)
			this.errorTextElement.innerText = errorMsg
			this.lastTimeout = setTimeout(() => {
				if (this.errorTextElement!.innerText === errorMsg) {
					this.clear()
				}
			}, clearAfterMs || (10 * 1000))
		} else if (errorMsg) {
			alert(errorMsg)
		}
	}

	clear() {
		if (this.errorTextElement) {
			this.errorTextElement.innerText = ""
		}
	}
}