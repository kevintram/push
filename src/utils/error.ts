import { ConvexError } from 'convex/values'

/**
 * The message a failed request can show the user, if it has one. Only a
 * `ConvexError` carries one: Convex redacts every other server error in
 * production, and those messages are not written for users anyway.
 */
export function getErrorMessage(error: unknown): string | undefined {
	if (error instanceof ConvexError && typeof error.data === 'string') {
		return error.data
	}

	return undefined
}
