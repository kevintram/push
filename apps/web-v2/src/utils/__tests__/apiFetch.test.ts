import * as v from 'valibot'
import { afterEach, describe, expect, it, vi } from 'vitest'

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u

function loadApiFetchModule() {
	vi.resetModules()
	vi.stubEnv('VITE_API_URL', 'http://api.example')
	return import('../apiFetch')
}

describe('apiFetch', () => {
	afterEach(() => {
		vi.restoreAllMocks()
		vi.unstubAllGlobals()
		vi.unstubAllEnvs()
	})

	it('includes credentials and the client-local date', async () => {
		const fetchSpy = vi.fn().mockResolvedValue(Response.json({ id: 7 }))
		vi.stubGlobal('fetch', fetchSpy)

		const { apiFetch } = await loadApiFetchModule()
		await expect(
			apiFetch(v.object({ id: v.number() }), '/topics/'),
		).resolves.toEqual({ id: 7 })

		expect(fetchSpy).toHaveBeenCalledWith(
			new URL('http://api.example/topics/'),
			expect.objectContaining({ credentials: 'include' }),
		)
		const headers = new Headers(fetchSpy.mock.calls[0]?.[1]?.headers)
		expect(headers.get('X-Client-Date')).toMatch(ISO_DATE_PATTERN)
	})

	it('redirects once and throws AuthRedirectError on concurrent 401s', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
		)
		const assignSpy = vi
			.spyOn(window.location, 'assign')
			.mockImplementation(() => {})

		const { apiFetch, AuthRedirectError } = await loadApiFetchModule()
		const results = await Promise.allSettled([
			apiFetch(v.unknown(), '/topics/'),
			apiFetch(v.unknown(), '/review-cards/'),
		])

		expect(assignSpy).toHaveBeenCalledTimes(1)
		const redirectUrl = new URL(assignSpy.mock.calls[0]?.[0] as string)
		expect(redirectUrl.origin).toBe('http://api.example')
		expect(redirectUrl.pathname).toBe('/login/')
		expect(redirectUrl.searchParams.get('return_to')).toBe(
			window.location.href,
		)
		for (const result of results) {
			expect(result.status).toBe('rejected')
			if (result.status === 'rejected') {
				expect(result.reason).toBeInstanceOf(AuthRedirectError)
			}
		}
	})

	it('serializes defined query parameters and JSON bodies', async () => {
		const fetchSpy = vi.fn().mockResolvedValue(Response.json({ id: 7 }))
		vi.stubGlobal('fetch', fetchSpy)

		const { apiFetch } = await loadApiFetchModule()
		await expect(
			apiFetch(v.object({ id: v.number() }), '/topics/', {
				method: 'POST',
				params: { parent_id: '4', omitted: undefined },
				body: { title: 'Topic' },
			}),
		).resolves.toEqual({ id: 7 })

		expect(fetchSpy).toHaveBeenCalledWith(
			new URL('http://api.example/topics/?parent_id=4'),
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ title: 'Topic' }),
				credentials: 'include',
			}),
		)
		const headers = new Headers(fetchSpy.mock.calls[0]?.[1]?.headers)
		expect(headers.get('Content-Type')).toBe('application/json')
	})

	it('returns undefined for a successful empty response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
		)

		const { apiFetch } = await loadApiFetchModule()
		await expect(
			apiFetch(v.undefined(), '/topics/7/', { method: 'DELETE' }),
		).resolves.toBeUndefined()
	})

	it('throws an ApiError with request context for unsuccessful responses', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
		)

		const { apiFetch, ApiError } = await loadApiFetchModule()
		const request = apiFetch(v.unknown(), '/topics/missing/')

		await expect(request).rejects.toMatchObject({
			name: ApiError.name,
			status: 404,
			path: '/topics/missing/',
		})
	})
})
