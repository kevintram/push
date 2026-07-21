/**
 * Typed API client for the 3gulp backend.
 *
 * Requests include authentication cookies and the browser's local date. JSON
 * responses are validated with the caller-provided Valibot schema.
 */

import * as v from 'valibot'

/**
 * A non-2xx API response. `data` is the canonical response body because the
 * response body has already been consumed by the time this error is thrown.
 */
export class HttpError extends Error {
	readonly response: Response
	readonly request: Request
	readonly data: unknown

	constructor(response: Response, request: Request, data: unknown) {
		const status = `${response.status} ${response.statusText}`.trim()
		super(
			`Request failed with status ${status}: ` +
				`${request.method} ${request.url}`,
		)
		this.name = new.target.name
		this.response = response
		this.request = request
		this.data = data
	}

	get status() {
		return this.response.status
	}
}

type ApiOptions = Omit<RequestInit, 'body'> & {
	params?: Record<string, string | undefined>
	body?: unknown
}

export async function apiFetch<TSchema extends v.GenericSchema>(
	schema: TSchema,
	path: string,
	options?: ApiOptions,
): Promise<v.InferOutput<TSchema>> {
	const { params, body, ...init } = options ?? {}

	const url = new URL(import.meta.env.VITE_API_URL + path)
	for (const [key, value] of Object.entries(params ?? {})) {
		if (value !== undefined) url.searchParams.set(key, value)
	}

	const hasBody = body !== undefined
	const headers = new Headers(init.headers)
	headers.set('X-Client-Date', getClientDate())
	if (hasBody) headers.set('Content-Type', 'application/json')

	const request = new Request(url, {
		...init,
		headers,
		body: hasBody ? JSON.stringify(body) : undefined,
		credentials: 'include',
	})
	const response = await fetch(request)

	if (!response.ok) {
		const error = new HttpError(
			response,
			request,
			await safeParse(response),
		)

		if (response.status === 401) startAuthRedirect()

		throw error
	}

	const data: unknown =
		response.status === 204 ? undefined : await response.json()
	return v.parse(schema, data)
}

function getClientDate() {
	const now = new Date()
	const year = now.getFullYear()
	const month = String(now.getMonth() + 1).padStart(2, '0')
	const day = String(now.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

async function safeParse(response: Response): Promise<unknown> {
	// Safely read the response and return whatever we got.
	//
	// First read as text (bc not guaranteed to contain valid JSON),
	// then as JSON if applicable
	try {
		const text = await response.text()
		if (text.trim().length === 0) return undefined

		const contentType = response.headers.get('Content-Type')?.toLowerCase()
		if (!contentType?.includes('json')) return text

		try {
			return JSON.parse(text) as unknown
		} catch {
			return text
		}
	} catch {
		return undefined
	}
}

let isAuthRedirectInFlight = false
function startAuthRedirect() {
	if (isAuthRedirectInFlight) return

	const url = new URL('/login/', import.meta.env.VITE_API_URL)
	url.searchParams.set('return_to', window.location.href)

	isAuthRedirectInFlight = true
	window.location.assign(url)
}
