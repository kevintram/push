import { afterEach, describe, expect, it, vi } from 'vitest'

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function loadApiFetchModule() {
	vi.resetModules()
	vi.stubEnv('VITE_API_URL', 'http://api.example')
	return import('./apiFetch')
}

describe('apiFetch', () => {
	afterEach(() => {
		vi.restoreAllMocks()
		vi.unstubAllGlobals()
		vi.unstubAllEnvs()
	})

	it('includes credentials and returns non-401 responses', async () => {
		const response = new Response('{}', { status: 200 })
		const fetchSpy = vi.fn().mockResolvedValue(response)
		vi.stubGlobal('fetch', fetchSpy)

		const { apiFetch } = await loadApiFetchModule()
		const result = await apiFetch('http://api.example/topics')

		expect(result).toBe(response)
		expect(fetchSpy).toHaveBeenCalledTimes(1)
		expect(fetchSpy).toHaveBeenCalledWith(
			'http://api.example/topics',
			expect.objectContaining({
				credentials: 'include'
			})
		)

		const headers = new Headers(fetchSpy.mock.calls[0]![1]?.headers)
		expect(headers.get('X-Client-Date')).toMatch(ISO_DATE_PATTERN)
	})

	it('redirects once and throws AuthRedirectError on 401', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response(null, { status: 401 }))
		)
		const replaceSpy = vi
			.spyOn(window.location, 'replace')
			.mockImplementation(() => {})

		const { apiFetch, AuthRedirectError } = await loadApiFetchModule()

		await expect(apiFetch('http://api.example/topics')).rejects.toBeInstanceOf(
			AuthRedirectError
		)
		expect(replaceSpy).toHaveBeenCalledTimes(1)
		expect(replaceSpy).toHaveBeenCalledWith('http://api.example/login/')
	})

	it('suppresses duplicate redirects for concurrent 401 responses', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response(null, { status: 401 }))
		)
		const replaceSpy = vi
			.spyOn(window.location, 'replace')
			.mockImplementation(() => {})

		const { apiFetch, AuthRedirectError } = await loadApiFetchModule()

		const results = await Promise.allSettled([
			apiFetch('http://api.example/topics'),
			apiFetch('http://api.example/review-cards')
		])

		expect(replaceSpy).toHaveBeenCalledTimes(1)
		for (const result of results) {
			expect(result.status).toBe('rejected')
			if (result.status === 'rejected') {
				expect(result.reason).toBeInstanceOf(AuthRedirectError)
			}
		}
	})
})
