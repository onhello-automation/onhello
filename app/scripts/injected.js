import { handleResponse } from './handle_response_body'


// This file is JavaScript because it was tricky to override XMLHttpRequest in TypeScript.

// Ideally we would reload the rules for each request, this helps if the rules changed.
// However, this could be expensive and will often not be necessary.
// Users will just have to refresh the tab of a site if they want to use the latest rules.
// Also, you can't access the extension storage directly in this context.

(function (xhr) {
	const XHR = XMLHttpRequest.prototype

	const open = XHR.open
	const send = XHR.send
	const setRequestHeader = XHR.setRequestHeader

	XHR.open = function (method, url) {
		// this._url = url
		this._requestHeaders = {}

		return open.apply(this, arguments)
	}

	XHR.setRequestHeader = function (header, value) {
		this._requestHeaders[header] = value
		return setRequestHeader.apply(this, arguments)
	}

	XHR.send = function (postData) {
		const rules = window._onhelloRules
		if (rules === undefined) {
			console.debug("onhello: XHR.send: No rules set.")
		} else {
			this.addEventListener('load', function () {
				// const responseHeaders = this.getAllResponseHeaders()
				try {
					for (const settings of rules.apps) {
						const url = this.responseURL
						if (settings === undefined || settings.urlPattern === undefined || !(new RegExp(settings.urlPattern, 'i').test(url))) {
							// console.debug("onhello: URL did not match the pattern.")
							return
						}
						// console.debug("onhello: URL:", url)

						if (this.responseType != 'blob') {
							let responseBody
							if (this.responseType === '' || this.responseType === 'text') {
								// console.debug("onhello: using responseText. responseType:", this.responseType, this.responseText)
								responseBody = JSON.parse(this.responseText)
							} else /* if (this.responseType === 'json') */ {
								// console.debug("onhello: using response. responseType:", this.responseType, this.response)
								responseBody = this.response
							}
							// console.debug("onhello: responseBody:", this.responseURL, responseBody)

							handleResponse(url, responseBody, this._requestHeaders, settings)
						}
					}
				} catch (err) {
					console.debug("onhello: Error reading response or processing rules.", err)
				}
			})
		}

		return send.apply(this, arguments)
	}
})(XMLHttpRequest)