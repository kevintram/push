type EstimateCardSizeOptions = {
	maxTitleLines?: number
	maxBodyLines?: number
}

function estimateLines(
	text: string,
	numCharsPerLine: number,
	maxLines?: number
): number {
	if (!text) return 0

	const lines = Math.max(1, Math.ceil(text.length / numCharsPerLine))
	return maxLines == null ? lines : Math.min(lines, maxLines)
}

function estimateCardHeight(
	title: string,
	body: string,
	laneWidth: number,
	options?: EstimateCardSizeOptions
): number {
	const chromeHeight = 92
	const titleLineHeight = 22
	const bodyLineHeight = 20
	const measurementSafetyBuffer = 4
	const minHeight = 96
	const charWidth = 8
	const padding = 24
	const numCharsPerLine =
		laneWidth > 0
			? Math.max(10, Math.floor((laneWidth - padding) / charWidth))
			: 30

	const titleLines = estimateLines(
		title,
		numCharsPerLine,
		options?.maxTitleLines
	)
	const bodyLines = estimateLines(body, numCharsPerLine, options?.maxBodyLines)

	const titleHeight = titleLines * titleLineHeight
	const bodyHeight = bodyLines * bodyLineHeight

	return Math.max(
		chromeHeight + titleHeight + bodyHeight + measurementSafetyBuffer,
		minHeight
	)
}

/**
 * Estimate the visible masonry height for a card using the same line clamps
 * as the card UI.
 */
export function estimateCardSize(
	title: string,
	body: string,
	laneWidth: number
): number {
	return estimateCardHeight(title, body, laneWidth, {
		maxTitleLines: 5,
		maxBodyLines: 8
	})
}

/**
 * Estimate the natural content height before the card UI clamps title/body
 * lines. This is used to decide when focused flashcards should switch into
 * the scrollable large-card shell.
 */
export function estimateExpandedCardSize(
	title: string,
	body: string,
	laneWidth: number
): number {
	return estimateCardHeight(title, body, laneWidth)
}
