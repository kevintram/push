import { useEffect, useState } from 'react'

function getMatches(query: string) {
	if (typeof window === 'undefined' || !('matchMedia' in window)) {
		return false
	}

	return window.matchMedia(query).matches
}

export function useMediaQuery(query: string) {
	const [matches, setMatches] = useState(() => getMatches(query))

	useEffect(() => {
		if (typeof window === 'undefined' || !('matchMedia' in window)) {
			return
		}

		const mediaQuery = window.matchMedia(query)

		function onMediaQueryChange(event: MediaQueryListEvent) {
			setMatches(event.matches)
		}

		mediaQuery.addEventListener('change', onMediaQueryChange)

		return () => {
			mediaQuery.removeEventListener('change', onMediaQueryChange)
		}
	}, [query])

	return matches
}
