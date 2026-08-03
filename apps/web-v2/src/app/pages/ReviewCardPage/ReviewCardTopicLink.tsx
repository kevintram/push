import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { topicQueries } from '~/modules/library'
import { colors } from '~/styles/colors.stylex'
import { spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	link: {
		display: 'flex',

		gap: spacing.sm,

		textDecoration: 'none',
		color: {
			default: colors.textLink,
			':hover': colors.textLinkHover,
			':active': colors.textLinkActive,
		},
	},
})

/**
 * The topic lookup depends on the review card's topicId, creating a query
 * waterfall: the layout loads the review card, then this component mounts and
 * loads its topic. This must be a separate component so its query hook remains
 * unconditional while the layout can return early when the review card is
 * missing.
 *
 * TODO(2): Remove the waterfall by returning the topic data with the review
 * card.
 */
export function ReviewCardTopicLink({ topicId }: { topicId: Id<'topics'> }) {
	const { data: topic } = useSuspenseQuery(topicQueries.detail(topicId))

	return (
		<Link
			to='/library/$topicId'
			params={{ topicId }}
			{...stylex.props(styles.link)}
		>
			<ArrowLeft />
			{topic.title.trim() || 'Untitled'}
		</Link>
	)
}
