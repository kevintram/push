/**
 * Custom fetch wrapper for API calls that handles authentication redirects.
 *
 * Features:
 * - Automatically includes credentials (cookies)
 * - Detects server redirects and navigates the browser (like a login button)
 * - No global error handling needed
 */

export async function apiFetch(
	url: string,
	options?: RequestInit
): Promise<Response> {
	const response = await fetch(url, {
		...options,
		credentials: 'include',
		redirect: 'manual'
	})

	// Server returned a redirect (likely auth redirect)
	// Navigate the full page, just like clicking a login link
	if (response.type === 'opaqueredirect') {
		window.location.href = url
		// Return a never-resolving promise since we're navigating away
		return new Promise(() => {})
	}

	return response
}
