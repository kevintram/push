/**
 * Typed API client for the 3gulp backend.
 *
 * Requests include authentication cookies and the browser's local date. JSON
 * responses are validated with the caller-provided Valibot schema.
 */

import * as v from 'valibot'

let isAuthRedirectInFlight = false

export class AuthRedirectError extends Error {
	constructor() {
		super('Authentication required')
		this.name = new.target.name
	}
}

export class ApiError extends Error {
	readonly status: number
	readonly path: string

	constructor(status: number, path: string) {
		super(`API request failed (${status}): ${path}`)
		this.name = new.target.name
		this.status = status
		this.path = path
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

	const response = await fetch(url, {
		...init,
		headers,
		body: hasBody ? JSON.stringify(body) : undefined,
		credentials: 'include',
	})

	if (response.status === 401) {
		startAuthRedirect()
		throw new AuthRedirectError()
	}
	if (!response.ok) throw new ApiError(response.status, path)

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

function startAuthRedirect() {
	if (isAuthRedirectInFlight) return

	const url = new URL('/login/', import.meta.env.VITE_API_URL)
	url.searchParams.set('return_to', window.location.href)

	isAuthRedirectInFlight = true
	window.location.assign(url)
}
