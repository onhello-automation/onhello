export function updateUrl(values: { [key: string]: string }): void {
	const currentUrlParams = new URLSearchParams(window.location.search)
	for (const [key, value] of Object.entries(values)) {
		currentUrlParams.set(key, value)
	}
	window.history.pushState({}, "", window.location.pathname + "?" + currentUrlParams.toString())
}