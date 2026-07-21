import { expect } from 'vitest'

type FetchMock = {
	mock: {
		calls: Array<Array<unknown>>
	}
}

export function getFetchRequest(fetchMock: FetchMock): Request {
	const request = fetchMock.mock.calls[0]?.[0]
	expect(request).toBeInstanceOf(Request)
	if (!(request instanceof Request)) {
		throw new TypeError('Expected fetch to receive a Request')
	}
	return request
}
