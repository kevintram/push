import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { Ellipsis, Plus, Trash2 } from 'lucide-react'
import { useCallback } from 'react'

import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Textarea,
} from '~/components/ui'
import { topicQueries, useDeleteTopic } from '~/modules/library'
import { ReviewCard } from '~/modules/reviews/components/ReviewCard'
import type { ReviewCard as ReviewCardModel } from '~/modules/reviews/types/review.types'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	layout,
	spacing,
} from '~/styles/tokens.stylex'

const reviewCards = Array.from({ length: 18 }, (_, index): ReviewCardModel => {
	const number = index + 1

	return {
		id: index === 0 ? 'typescript-generics' : `topic-review-card-${number}`,
		topic_id: 'topic-id',
		type: index % 4 === 3 ? 'practice' : 'flashcard',
		primary_text:
			index === 0
				? 'What problem do generics solve?'
				: `Topic mock card ${number}: TypeScript concept`,
		secondary_text:
			index === 0
				? 'They let code work with many types while preserving type safety.'
				: `An example answer for topic mock card ${number}.`,
		notes: `Overflow test notes for topic mock card ${number}.`,
		stability: 4 + (index % 8),
		last_reviewed_at: '2026-07-28',
		next_due_at: '2026-07-30',
		freshness_tier: index % 5 === 4 ? 'Needs attention' : 'Fresh',
		flagged_at: index % 5 === 4 ? '2026-07-25' : null,
	}
})

const styles = stylex.create({
	container: {
		display: 'flex',
		justifyContent: 'center',
		minHeight: '100%',
		width: '100%',

		overflow: 'auto',
	},
	content: {
		padding: spacing.xl,
		gap: spacing.md,
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 1,
		maxWidth: layout.contentMaxWidth,
		minWidth: 0,
		width: '100%',
	},
	header: { gap: spacing.sm, display: 'flex', flexDirection: 'column' },
	titleBar: { gap: spacing.sm, alignItems: 'center', display: 'flex' },
	title: {
		fontSize: fontSizes.xl,
		fontWeight: fontWeights.bold,
		minBlockSize: '44px',
	},
	description: { fontSize: fontSizes.md },
	reviewCardsHeaderContainer: { display: 'flex' },
	reviewCardsHeaderText: { flexBasis: 0, flexGrow: 1, flexShrink: 1 },
	reviewCardsList: { display: 'flex', flexDirection: 'column' },
})

export function TopicPage() {
	const { topicId } = useParams({ from: '/library/$topicId' })
	const { data: topic } = useSuspenseQuery(topicQueries.detail(topicId))
	const deleteTopic = useDeleteTopic()

	const handleDeleteTopic = useCallback(() => {
		deleteTopic.mutate({ topicId })
	}, [deleteTopic, topicId])

	if (!topic) return null

	return (
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.content)}>
				<header {...stylex.props(styles.header)}>
					<div {...stylex.props(styles.titleBar)}>
						<Textarea
							aria-label='Topic title'
							readOnly
							value={topic.title}
							xstyle={styles.title}
						/>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button.Icon
										aria-label='Topic actions'
										shape='round'
										variant='ghost'
									/>
								}
							>
								<Ellipsis aria-hidden='true' />
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuItem
									disabled={deleteTopic.isPending}
									onClick={handleDeleteTopic}
								>
									<Trash2
										aria-hidden='true'
										size={iconSizes.md}
									/>
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<Textarea
						aria-label='Topic description'
						readOnly
						value={topic.description}
						xstyle={styles.description}
					/>
				</header>

				<div {...stylex.props(styles.reviewCardsHeaderContainer)}>
					<h2 {...stylex.props(styles.reviewCardsHeaderText)}>
						Review Cards
					</h2>
					<Button.Icon
						aria-label='Add review card'
						disabled
						shape='round'
					>
						<Plus aria-hidden='true' />
					</Button.Icon>
				</div>

				<div {...stylex.props(styles.reviewCardsList)}>
					{reviewCards.map(reviewCard => (
						<ReviewCard key={reviewCard.id} {...reviewCard} />
					))}
				</div>
			</div>
		</div>
	)
}
