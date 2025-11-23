import Cookies from 'js-cookie'

const COOKIE_OPTIONS: Cookies.CookieAttributes = {
	expires: 30, // 30 days
	path: '/',
	sameSite: 'lax'
}

/**
 * Get a value from a cookie and parse it as JSON
 */
export function getCookie<T>(key: string): T | null {
	const value = Cookies.get(key)
	if (!value) return null

	try {
		return JSON.parse(value) as T
	} catch {
		return null
	}
}

/**
 * Set a cookie value with JSON serialization
 */
export function setCookie<T>(key: string, value: T): void {
	Cookies.set(key, JSON.stringify(value), COOKIE_OPTIONS)
}

/**
 * Remove a cookie
 */
export function removeCookie(key: string): void {
	Cookies.remove(key, { path: '/' })
}
