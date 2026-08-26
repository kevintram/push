import * as stylex from '@stylexjs/stylex'

import { reviewCardPropertiesColors } from '~/styles/colors/components.stylex'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'
import { formatRelativeDate } from '~/utils/date'

import type { ReviewCardSrsState } from '../../types/review.types'
import { getFreshnessTier } from '../../utils/reviewCardSrs'

const styles = stylex.create({
	container: {
		padding: spacing.lg,
		borderRadius: radii.xl,
		backgroundColor: reviewCardPropertiesColors.containerBackground,
		flexShrink: 0,
	},
	title: {
		margin: 0,

		color: semanticColors.textSecondary,
		fontSize: fontSizes.md,
		fontWeight: fontWeights.medium,
		paddingBlockEnd: spacing.sm,
	},
	list: {
		columnGap: spacing['3xl'],
		rowGap: spacing.sm,

		display: 'grid',
		gridTemplateColumns: 'auto minmax(0, 1fr)',

		fontSize: fontSizes.sm,
	},
	row: {
		display: 'contents',
	},
	label: {
		color: reviewCardPropertiesColors.labelForeground,
		fontWeight: fontWeights.medium,
	},
	value: {
		color: reviewCardPropertiesColors.valueForeground,
		whiteSpace: 'nowrap',
	},
	fresh: { color: reviewCardPropertiesColors.freshnessFreshForeground },
	fine: { color: reviewCardPropertiesColors.freshnessFineForeground },
	hazy: { color: reviewCardPropertiesColors.freshnessHazyForeground },
	forgotten: {
		color: reviewCardPropertiesColors.freshnessForgottenForeground,
	},
})

type ReviewCardPropertiesPanelProps = ReviewCardSrsState & {
	today: DateString
}

export function ReviewCardPropertiesPanel({
	nextDueAt,
	retrievability,
	stability,
	today,
}: ReviewCardPropertiesPanelProps) {
	const freshness = getFreshnessTier(retrievability)
	const roundedStability = stability === null ? null : Math.round(stability)

	return (
		<section aria-label='Properties' {...stylex.props(styles.container)}>
			<p {...stylex.props(styles.title)}>Properties</p>
			<div {...stylex.props(styles.list)}>
				<div {...stylex.props(styles.row)}>
					<span {...stylex.props(styles.label)}>Due</span>
					<span {...stylex.props(styles.value)}>
						{nextDueAt === null
							? 'Unscheduled'
							: formatRelativeDate(nextDueAt, today)}
					</span>
				</div>
				<div {...stylex.props(styles.row)}>
					<span {...stylex.props(styles.label)}>Freshness</span>
					<span
						{...stylex.props(
							styles.value,
							freshness === 'Fresh' && styles.fresh,
							freshness === 'Fine' && styles.fine,
							freshness === 'Hazy' && styles.hazy,
							freshness === 'Forgotten' && styles.forgotten,
						)}
					>
						{freshness ?? '—'}
					</span>
				</div>
				<div {...stylex.props(styles.row)}>
					<span {...stylex.props(styles.label)}>Durability</span>
					<span {...stylex.props(styles.value)}>
						{roundedStability === null
							? '—'
							: `${roundedStability} ${roundedStability === 1 ? 'day' : 'days'}`}
					</span>
				</div>
			</div>
		</section>
	)
}
