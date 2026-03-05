export class HttpStatusError extends Error {
	status: number
	url: string

	constructor(status: number, url: string, statusText?: string) {
		const suffix = statusText ? ` ${statusText}` : ''
		super(`API request failed: ${status}${suffix}`)
		this.name = 'HttpStatusError'
		this.status = status
		this.url = url
	}
}

export function isHttpStatusError(error: unknown): error is HttpStatusError {
	return error instanceof HttpStatusError
}
