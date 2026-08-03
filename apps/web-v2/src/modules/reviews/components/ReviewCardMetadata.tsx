import * as stylex from '@stylexjs/stylex'
import { Check } from 'lucide-react'

import { colors } from '~/styles/colors.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	spacing,
} from '~/styles/tokens.stylex'
import { formatRelativeDate } from '~/utils/date'

import type { ReviewCardSrsState } from '../types/review.types'

const styles = stylex.create({
	container: {
		gap: spacing.xl,
		alignItems: 'center',
		display: 'flex',
		flexGrow: 1,
		flexWrap: 'wrap',
		fontSize: fontSizes.sm,
	},
	item: {
		gap: spacing.xs,
		alignItems: 'center',
		color: colors.textSecondary,
		display: 'inline-flex',
		fontWeight: fontWeights.semibold,
		whiteSpace: 'nowrap',
	},
})

/**
 * Scheduling summary for a review card. Every field is optional because Convex
 * does not track SRS state yet, in which case the card reads as unreviewed.
 */
export function ReviewCardMetadata({
	freshnessTier,
	lastReviewedAt,
	nextDueAt,
	stability,
}: ReviewCardSrsState) {
	if (lastReviewedAt === null) {
		return (
			<div {...stylex.props(styles.container)}>
				<span {...stylex.props(styles.item)}>Unreviewed</span>
			</div>
		)
	}

	return (
		<div {...stylex.props(styles.container)}>
			{freshnessTier !== null ? (
				<span {...stylex.props(styles.item)}>{freshnessTier}</span>
			) : null}
			{nextDueAt !== null ? (
				<span {...stylex.props(styles.item)}>
					{`Due ${formatRelativeDate(nextDueAt)}`}
				</span>
			) : null}
			<span {...stylex.props(styles.item)}>
				<Check size={iconSizes.md} />
				{formatRelativeDate(lastReviewedAt)}
			</span>
			{stability !== null ? (
				<span {...stylex.props(styles.item)}>
					Durable for {Math.round(stability)}d
				</span>
			) : null}
		</div>
	)
}
