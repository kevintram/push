// Paths up to this length render in full. A longer path collapses to
// `Root / … / Parent`, so the ellipsis always stands in for at least two
// collections.
const MAX_FULL_PATH_LENGTH = 3

// collapseCollectionPath splits a root-first collection path into the parts a
// breadcrumb trail shows: `head` before the ellipsis, `hidden` behind it, and
// `tail` after it. `hidden` is empty when the path fits.
export function collapseCollectionPath<T>(path: ReadonlyArray<T>) {
	if (path.length <= MAX_FULL_PATH_LENGTH) {
		return { head: path.slice(), hidden: [], tail: [] }
	}
	return {
		head: path.slice(0, 1),
		hidden: path.slice(1, -1),
		tail: path.slice(-1),
	}
}
