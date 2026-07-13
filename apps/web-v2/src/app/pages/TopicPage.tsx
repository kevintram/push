import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { Textarea } from '~/components/ui'
import { useAutoSave } from '~/hooks/useAutoSave'
import { topicQueries } from '~/modules/library/api/queries'
import { useUpdateTopic } from '~/modules/library/api/updateTopic'
import { reviewCardQueries } from '~/modules/reviews/api/queries'
import { ReviewCard } from '~/modules/reviews/components/ReviewCard'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		padding: spacing.xl,
		gap: spacing.md,

		display: 'flex',
		flexDirection: 'column',

		flexBasis: 0,
		flexGrow: '1',
		flexShrink: '1',
	},
	header: {
		gap: spacing.sm,

		display: 'flex',
		flexDirection: 'column',
	},
	title: {
		fontSize: fontSizes.xl,
		fontWeight: fontWeights.bold,
		minBlockSize: '44px',
	},
	body: { fontSize: fontSizes.md },
	reviewCards: {
		display: 'flex',
		flexDirection: 'column',
	},
})

export function TopicPage() {
	const { topicId } = useParams({ from: '/library/$topicId' })

	const { data: topic } = useQuery(topicQueries.detail(topicId))
	const { data: reviewCards } = useQuery(reviewCardQueries.list({ topicId }))
	const { mutateAsync } = useUpdateTopic()

	const saveTitle = useCallback(
		async (title: string) => {
			if (!topic || title === topic.title) return
			try {
				await mutateAsync({ id: topic.id, title })
			} catch {
				toast.error('Failed to update topic title')
			}
		},
		[mutateAsync, topic],
	)

	const saveBody = useCallback(
		async (body: string) => {
			if (!topic || body === topic.body) return
			try {
				await mutateAsync({ id: topic.id, body })
			} catch {
				toast.error('Failed to update topic body')
			}
		},
		[mutateAsync, topic],
	)

	const title = useAutoSave({
		initialValue: topic?.title ?? '',
		onSave: saveTitle,
		key: `topic-title-${topic?.id ?? topicId}`,
	})
	const body = useAutoSave({
		initialValue: topic?.body ?? '',
		onSave: saveBody,
		key: `topic-body-${topic?.id ?? topicId}`,
	})

	return (
		<div {...stylex.props(styles.container)}>
			<header {...stylex.props(styles.header)}>
				{topic && (
					<>
						<Textarea
							aria-label='Topic title'
							placeholder='Topic title'
							value={title.value}
							onChange={title.onChange}
							onBlur={title.flush}
							xstyle={styles.title}
						/>
						<Textarea
							aria-label='Topic body'
							placeholder='Add a topic description'
							value={body.value}
							onChange={body.onChange}
							onBlur={body.flush}
							xstyle={styles.body}
						/>
					</>
				)}
			</header>

			<h2>Review Cards</h2>

			<div {...stylex.props(styles.reviewCards)}>
				{reviewCards?.map(reviewCard => (
					<ReviewCard key={reviewCard.id} {...reviewCard} />
				))}
			</div>
		</div>
	)
}
