import { useState } from 'react'

type UseRevealOnEmptyOptions = {
	/** Changes to this value mark a new reset point. */
	resetKey: string
	/** Whether the field is empty as of the current reset point. */
	isEmpty: boolean
}

/**
 * Tracks whether a `Hideable` field should start revealed because it was
 * empty, without re-hiding it the moment the user types something.
 *
 * `revealed` is only recomputed from `isEmpty` when `resetKey` changes (for
 * example, switching cards or toggling hide mode). Between reset points the
 * value is sticky: it survives edits that make the field non-empty just as
 * readily as ones that empty it back out, and a remote update that empties
 * the field while it is hidden does not reveal it early.
 */
export function useRevealOnEmpty({
	resetKey,
	isEmpty,
}: UseRevealOnEmptyOptions) {
	const [revealed, setRevealed] = useState(isEmpty)
	const [prevKey, setPrevKey] = useState(resetKey)

	if (prevKey !== resetKey) {
		setPrevKey(resetKey)
		setRevealed(isEmpty)
	}

	return [revealed, setRevealed] as const
}
