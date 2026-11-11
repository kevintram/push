import * as stylex from '@stylexjs/stylex'

import { orange, violet } from '~/styles/colors/colorsPrimitive.stylex'

/** Colors for a card's active statuses, shared by its toggles and menu. */
export const cardStatusStyles = stylex.create({
	flagOn: {
		fill: orange.s500,
		color: orange.s500,
	},
	// Stroke only, unlike `flagOn`. `Flag` fills into a legible solid shape; a filled `Archive` collapses into a blob that reads
	// like the neighbouring trash icon.
	retiredOn: {
		color: violet.s400,
	},
})
