import * as v from 'valibot'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getFetchRequest } from '~/testing/getFetchRequest'

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

		expect(fetchSpy).toHaveBeenCalledTimes(1)
		const request = getFetchRequest(fetchSpy)
		expect(request.url).toBe('http://api.example/topics/')
		expect(request.credentials).toBe('include')
		expect(request.headers.get('X-Client-Date')).toMatch(ISO_DATE_PATTERN)
	})

	it('redirects once and throws HttpError on concurrent 401s', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockImplementation(() =>
					Promise.resolve(
						Response.json(
							{ detail: 'Authentication required' },
							{ status: 401 },
						),
					),
				),
		)
		const assignSpy = vi
			.spyOn(window.location, 'assign')
			.mockImplementation(() => {})

		const { apiFetch, HttpError } = await loadApiFetchModule()
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
				expect(result.reason).toBeInstanceOf(HttpError)
				expect(result.reason).toMatchObject({
					status: 401,
					data: { detail: 'Authentication required' },
				})
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

		expect(fetchSpy).toHaveBeenCalledTimes(1)
		const request = getFetchRequest(fetchSpy)
		expect(request.url).toBe('http://api.example/topics/?parent_id=4')
		expect(request.method).toBe('POST')
		expect(request.credentials).toBe('include')
		expect(request.headers.get('Content-Type')).toBe('application/json')
		await expect(request.clone().json()).resolves.toEqual({
			title: 'Topic',
		})
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

	it('throws an HttpError with request, response, and parsed data', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue(
					Response.json(
						{ detail: 'Topic not found' },
						{ status: 404, statusText: 'Not Found' },
					),
				),
		)

		const { apiFetch, HttpError } = await loadApiFetchModule()
		const error: unknown = await apiFetch(
			v.unknown(),
			'/topics/missing/',
		).catch((error: unknown) => error)

		expect(error).toBeInstanceOf(HttpError)
		if (!(error instanceof HttpError)) throw error

		expect(error.name).toBe('HttpError')
		expect(error.status).toBe(404)
		expect(error.data).toEqual({ detail: 'Topic not found' })
		expect(error.response.status).toBe(404)
		expect(error.request.method).toBe('GET')
		expect(error.request.url).toBe('http://api.example/topics/missing/')
		expect(error.message).toBe(
			'Request failed with status 404 Not Found: ' +
				'GET http://api.example/topics/missing/',
		)
	})

	it('retains malformed JSON error bodies as text', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response('upstream returned invalid JSON', {
					status: 502,
					headers: { 'Content-Type': 'application/json' },
				}),
			),
		)

		const { apiFetch } = await loadApiFetchModule()
		await expect(apiFetch(v.unknown(), '/topics/')).rejects.toMatchObject({
			data: 'upstream returned invalid JSON',
		})
	})
})
