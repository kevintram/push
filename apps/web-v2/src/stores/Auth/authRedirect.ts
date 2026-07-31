const defaultReturnTo = '/'

export function getCurrentReturnTo() {
	return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

export function getSafeReturnToUrl(state: unknown) {
	if (
		typeof state !== 'object' ||
		state === null ||
		!('returnTo' in state) ||
		typeof state.returnTo !== 'string'
	) {
		return new URL(defaultReturnTo, window.location.origin).href
	}

	try {
		const returnToUrl = new URL(state.returnTo, window.location.origin)

		return returnToUrl.origin === window.location.origin
			? returnToUrl.href
			: new URL(defaultReturnTo, window.location.origin).href
	} catch {
		return new URL(defaultReturnTo, window.location.origin).href
	}
}

export function redirectToReturnTo(state: unknown) {
	window.location.replace(getSafeReturnToUrl(state))
}
