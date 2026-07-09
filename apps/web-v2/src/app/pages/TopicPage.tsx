import * as stylex from '@stylexjs/stylex'
import { useParams } from '@tanstack/react-router'

import topics from '~/modules/library/mock-data/topics.json'
import type { Topic } from '~/modules/library/types/topic.types'
import { ReviewCard } from '~/modules/reviews/components/ReviewCard'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		padding: spacing.xl,
		gap: spacing.md,

		display: 'flex',
		flexDirection: 'column',
	},
	header: {
		gap: spacing.sm,

		display: 'flex',
		flexDirection: 'column',
	},
	title: {
		fontWeight: fontWeights.bold,
	},
	body: {
		fontSize: fontSizes.md,
	},
	reviewCards: {
		display: 'flex',
		flexDirection: 'column',
	},
})

// Temporary testing measure: DFS through mock topics to find the current route.
function findTopicById(
	topicsToSearch: Array<Topic>,
	topicId: string,
): Topic | undefined {
	for (const topic of topicsToSearch) {
		if (topic.slug === topicId || String(topic.id) === topicId) {
			return topic
		}

		const childTopic = findTopicById(topic.children, topicId)

		if (childTopic) {
			return childTopic
		}
	}

	return undefined
}

export function TopicPage() {
	const { topicId } = useParams({ from: '/library/$topicId' })
	const topic = findTopicById(topics as Array<Topic>, topicId)

	if (!topic) {
		return <div>Topic not found.</div>
	}

	return (
		<div {...stylex.props(styles.container)}>
			<header {...stylex.props(styles.header)}>
				<h1 {...stylex.props(styles.title)}>{topic.title}</h1>
				<p {...stylex.props(styles.body)}>{topic.body}</p>
			</header>

			<h2>Review Cards</h2>

			<div {...stylex.props(styles.reviewCards)}>
				{topic.reviewCards.map(reviewCard => (
					<ReviewCard
						key={reviewCard.id}
						primary_text={reviewCard.primary_text}
						secondary_text={reviewCard.secondary_text}
					/>
				))}
			</div>
		</div>
	)
}
