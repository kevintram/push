import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'

import { semanticColors } from '~/styles/colors/semantic.stylex'
import { radii, spacing } from '~/styles/tokens.stylex'

import { ReviewComposer } from '../ReviewComposer'
import { CardReviewsPanel } from './CardReviewsPanel'

const styles = stylex.create({
	composerSurface: {
		padding: spacing.md,
		borderRadius: radii.xl,
		backgroundColor: semanticColors.surfaceRaised,
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
