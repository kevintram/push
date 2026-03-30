import type { ReactNode } from 'react'

interface HighlightTextProps {
	text: string
	query: string
	className?: string
}

export function highlightText({
	text,
	query,
	className = ''
}: HighlightTextProps): ReactNode {
	if (!(query.trim() && text)) {
		return text
	}

	const regex = new RegExp(
		`(${query.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')})`,
		'gi'
	)
	const parts = text.split(regex)

	return parts.map((part, index) => {
		const isMatch = regex.test(part)
		regex.lastIndex = 0 // Reset regex for next test

		if (isMatch) {
			return (
				<mark
					className={`bg-yellow-200 text-yellow-900 dark:bg-yellow-400/30 dark:text-yellow-200 ${className}`}
					key={index}
				>
					{part}
				</mark>
			)
		}
		return part
	})
}

export function truncateWithHighlight(
	text: string,
	query: string,
	maxLength = 150
): ReactNode {
	if (!text) return ''

	if (text.length <= maxLength) {
		return highlightText({ text, query })
	}

	// If query is found, try to center the truncation around the first match
	if (query.trim()) {
		const queryIndex = text.toLowerCase().indexOf(query.toLowerCase())
		if (queryIndex !== -1) {
			const start = Math.max(0, queryIndex - Math.floor(maxLength / 2))
			const end = Math.min(text.length, start + maxLength)
			const truncated = text.slice(start, end)
			const prefix = start > 0 ? '...' : ''
			const suffix = end < text.length ? '...' : ''

			return (
				<>
					{prefix}
					{highlightText({ text: truncated, query })}
					{suffix}
				</>
			)
		}
	}

	// Fallback: simple truncation from start
	return (
		<>
			{highlightText({ text: text.slice(0, maxLength), query })}
			{text.length > maxLength && '...'}
		</>
	)
}
