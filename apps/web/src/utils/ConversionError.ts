export class ConversionError extends Error {
	statusCode: number

	constructor(message: string, statusCode: number) {
		super(message)
		this.name = 'ConversionError'
		this.statusCode = statusCode
	}
}
