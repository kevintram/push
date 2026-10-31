import * as stylex from '@stylexjs/stylex'

// StyleX's dev server only resolves shared constants through the `~` alias.
import { tableMarker } from '~/modules/reviews/components/table.stylex'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { fontSizes, fontWeights } from '~/styles/tokens.stylex'

/** Column labels shared by the card and review tables. */
export const tableHeaderStyles = stylex.create({
	label: {
		color: colorsSemantic.textTertiary,
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.semibold,
	},
	// Shown while the table is hovered, holds keyboard focus, or has a popup
	// open, such as a header action's menu. Always shown on touch, where there
	// is no hover to reveal it. Needs `tableMarker` on the table's container.
	// Apply it inside any header cell that draws a rule, so the rule stays.
	revealed: {
		opacity: {
			default: null,
			'@media (hover: hover)': {
				default: '0',
				[stylex.when.ancestor(':has(:focus-visible)', tableMarker)]: 1,
				[stylex.when.ancestor(':has([data-popup-open])', tableMarker)]:
					1,
				[stylex.when.ancestor(':hover', tableMarker)]: 1,
			},
		},
	},
})
