/**
 * Custom fetch wrapper for API calls that handles authentication redirects.
 *
 * Features:
 * - Automatically includes credentials (cookies)
 * - Detects 401 errors and redirects to login page once
 */

const TRAILING_SLASH_PATTERN = /\/$/u

let isAuthRedirectInFlight = false

export class AuthRedirectError extends Error {
	constructor() {
		super('Authentication required')
		this.name = new.target.name
	}
}

function getLoginUrl(): string {
	return `${import.meta.env.VITE_API_URL.replace(TRAILING_SLASH_PATTERN, '')}/login/`
}

function startAuthRedirect() {
	if (isAuthRedirectInFlight) {
		return
	}

	isAuthRedirectInFlight = true
	window.location.replace(getLoginUrl())
}

export async function apiFetch(
	url: string,
	options?: RequestInit
): Promise<Response> {
	const headers = new Headers(options?.headers)
	if (!headers.has('X-Client-Date')) {
		const now = new Date()
		const year = now.getFullYear()
		const month = String(now.getMonth() + 1).padStart(2, '0')
		const day = String(now.getDate()).padStart(2, '0')
		headers.set('X-Client-Date', `${year}-${month}-${day}`)
	}

	const response = await fetch(url, {
		...options,
		headers,
		credentials: 'include'
	})

	if (response.status === 401) {
		startAuthRedirect()
		throw new AuthRedirectError()
	}

	return response
}
