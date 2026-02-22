/**
 * Custom fetch wrapper for API calls that handles authentication redirects.
 *
 * Features:
 * - Automatically includes credentials (cookies)
 * - Detects 401 errors and redirects to login page
 * - No global error handling needed
 */

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

	// Server returned 401 Unauthorized
	// Navigate to login page
	if (response.status === 401) {
		window.location.href = `${import.meta.env.VITE_API_URL}/login`
		// Return a never-resolving promise since we're navigating away
		return new Promise(() => {})
	}

	return response
}
