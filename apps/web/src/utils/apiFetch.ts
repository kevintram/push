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
	const response = await fetch(url, {
		...options,
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
