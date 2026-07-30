import * as stylex from '@stylexjs/stylex'
import { Ellipsis, Plus, Trash2 } from 'lucide-react'

import { ContentColumn } from '~/components/ContentColumn'
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Textarea,
} from '~/components/ui'
import { ReviewCard } from '~/modules/reviews/components/ReviewCard'
import type { ReviewCard as ReviewCardModel } from '~/modules/reviews/types/review.types'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	spacing,
} from '~/styles/tokens.stylex'

const topic = {
	id: 'learning-typescript',
	title: 'Learning TypeScript',
	body: 'Notes and flashcards for TypeScript fundamentals.',
}
const reviewCards: Array<ReviewCardModel> = [
	{
		id: 'typescript-generics',
		topic_id: topic.id,
		type: 'flashcard',
		primary_text: 'What problem do generics solve?',
		secondary_text:
			'They let code work with many types while preserving type safety.',
		notes: 'Start with simple examples.',
		stability: 8,
		last_reviewed_at: '2026-07-28',
		next_due_at: '2026-07-30',
		freshness_tier: 'Fresh',
		flagged_at: null,
	},
]

const styles = stylex.create({
	container: {
		padding: spacing.xl,
		gap: spacing.md,
		display: 'flex',
		flexDirection: 'column',
	},
	header: { gap: spacing.sm, display: 'flex', flexDirection: 'column' },
	titleBar: { gap: spacing.sm, alignItems: 'center', display: 'flex' },
	title: {
		fontSize: fontSizes.xl,
		fontWeight: fontWeights.bold,
		minBlockSize: '44px',
	},
	body: { fontSize: fontSizes.md },
	reviewCardsHeaderContainer: { display: 'flex' },
	reviewCardsHeaderText: { flexBasis: 0, flexGrow: 1, flexShrink: 1 },
	reviewCardsList: { display: 'flex', flexDirection: 'column' },
})

export function TopicPage() {
	return (
		<ContentColumn xstyle={styles.container}>
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
							<DropdownMenuItem disabled>
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
					aria-label='Topic body'
					readOnly
					value={topic.body}
					xstyle={styles.body}
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
		</ContentColumn>
	)
}
