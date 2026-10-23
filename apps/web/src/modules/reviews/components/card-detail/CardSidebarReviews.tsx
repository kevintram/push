import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { radii, spacing } from '~/styles/tokens.stylex'

import { ReviewComposer } from '../ReviewComposer'
import { CardReviewsPanel } from './CardReviewsPanel'

const styles = stylex.create({
	composerSurface: {
		padding: spacing.md,
		borderColor: colorsSemantic.borderSubtle,
		borderRadius: radii.xl,
		borderStyle: 'solid',
		borderWidth: 1,
		backgroundColor: colorsSemantic.surfaceRaised,
		flexShrink: 0,
		inlineSize: '100%',
		minInlineSize: 0,
	},
})

type CardSidebarReviewsProps = {
	cardId: Id<'cards'>
}

export function CardSidebarReviews({ cardId }: CardSidebarReviewsProps) {
	return (
		<>
			<div {...stylex.props(styles.composerSurface)}>
				<ReviewComposer />
			</div>
			<CardReviewsPanel cardId={cardId} />
		</>
	)
}
