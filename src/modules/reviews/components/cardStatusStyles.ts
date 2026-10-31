import * as stylex from '@stylexjs/stylex'

import { amber, orange, violet } from '~/styles/colors/colorsPrimitive.stylex'

/** Colors for a card's active statuses, shared by its toggles and menu. */
export const cardStatusStyles = stylex.create({
	flashcardOn: {
		fill: amber.s400,
		color: amber.s400,
	},
	flagOn: {
		fill: orange.s500,
		color: orange.s500,
	},
	// Stroke only, unlike `flagOn` and `flashcardOn`. `Flag` and `Zap` fill into
	// legible solid shapes; a filled `Archive` collapses into a blob that reads
	// like the neighbouring trash icon.
	retiredOn: {
		color: violet.s400,
	},
})
