/**
 * Estimate the height for a card in masonry layout based on two text fields.
 */
export function estimateCardSize(
	title: string,
	body: string,
	laneWidth: number
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

	const titleLines = title
		? Math.max(1, Math.ceil(title.length / numCharsPerLine))
		: 0
	const bodyLines = body
		? Math.max(1, Math.ceil(body.length / numCharsPerLine))
		: 0
	const clampedTitleLines = Math.min(titleLines, 5)
	const clampedBodyLines = Math.min(bodyLines, 8)

	const titleHeight = clampedTitleLines * titleLineHeight
	const bodyHeight = clampedBodyLines * bodyLineHeight

	return Math.max(
		chromeHeight + titleHeight + bodyHeight + measurementSafetyBuffer,
		minHeight
	)
}
