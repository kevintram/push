import * as stylex from '@stylexjs/stylex'
import { Check, Ellipsis, Flag, Trash2, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Hideable } from '~/components/Hideable'
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Separator,
	Textarea,
} from '~/components/ui'
import { ReviewsSidebar } from '~/modules/reviews/components/ReviewsSidebar'
import type { ReviewCard } from '~/modules/reviews/types/review.types'
import { useHideMode } from '~/stores/HideMode'
import { colors } from '~/styles/colors.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	layout,
	spacing,
} from '~/styles/tokens.stylex'
import { formatRelativeDate } from '~/utils/date'

const reviewCard: ReviewCard = {
	id: 'typescript-generics',
	topic_id: 'learning-typescript',
	type: 'flashcard',
	primary_text: 'What problem do generics solve?',
	secondary_text: 'They preserve type safety across reusable code.',
	notes: 'Start with simple examples.',
	stability: 8,
	last_reviewed_at: '2026-07-28',
	next_due_at: '2026-07-30',
	freshness_tier: 'Fresh',
	flagged_at: null,
}
const styles = stylex.create({
	layout: {
		display: 'flex',

		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,

		overflow: 'hidden',
	},
	main: {
		paddingBlock: spacing.xl,
		paddingInline: spacing.sm,

		display: 'flex',
		justifyContent: 'center',

		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		minWidth: 0,

		overflow: 'auto',
	},
	content: {
		gap: spacing.xl,
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 1,
		maxWidth: layout.contentMaxWidth,
		minWidth: 0,
		width: '100%',
	},
	primary: {
		fontSize: fontSizes.xl,
		fontWeight: fontWeights.bold,
	},
	secondary: { fontSize: fontSizes.md },
	separatorGroup: {
		gap: spacing.sm,
		display: 'flex',
		flexDirection: 'column',
	},
	footer: { gap: spacing.md, alignItems: 'center', display: 'flex' },
	metadata: {
		gap: spacing.xl,
		alignItems: 'center',
		display: 'flex',
		flexGrow: 1,
		flexWrap: 'wrap',
		fontSize: fontSizes.sm,
	},
	metadataItem: {
		gap: spacing.xs,
		alignItems: 'center',
		color: colors.textSecondary,
		display: 'inline-flex',
		fontWeight: fontWeights.semibold,
		whiteSpace: 'nowrap',
	},
	actions: {
		gap: spacing.xs,
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
	},
	flashcardOn: {
		fill: colors.iconFlashcardActive,
		color: colors.iconFlashcardActive,
	},
	flagOn: {
		fill: colors.iconFlagActive,
		color: colors.iconFlagActive,
	},
	notesContainer: { flexBasis: 0, flexGrow: 1, flexShrink: 1 },
	notes: { blockSize: '100%', fontSize: fontSizes.md, inlineSize: '100%' },
})

export function ReviewCardPageOverview() {
	const { hideMode } = useHideMode()
	const [secondaryRevealed, setSecondaryRevealed] = useState(false)
	const [notesRevealed, setNotesRevealed] = useState(false)
	useEffect(() => {
		setSecondaryRevealed(false)
		setNotesRevealed(false)
	}, [hideMode])
	return (
		<div {...stylex.props(styles.layout)}>
			<main {...stylex.props(styles.main)}>
				<div {...stylex.props(styles.content)}>
					<Textarea
						aria-label='Review-card primary text'
						readOnly
						value={reviewCard.primary_text}
						xstyle={styles.primary}
					/>
					<Hideable
						revealed={
							reviewCard.type === 'practice' ||
							hideMode === 'off' ||
							secondaryRevealed
						}
						onRevealedChange={setSecondaryRevealed}
					>
						<Textarea
							aria-label='Review-card secondary text'
							readOnly
							value={reviewCard.secondary_text}
							xstyle={styles.secondary}
						/>
					</Hideable>
					<div {...stylex.props(styles.separatorGroup)}>
						<div {...stylex.props(styles.footer)}>
							<div {...stylex.props(styles.metadata)}>
								{reviewCard.last_reviewed_at === null ? (
									<span
										{...stylex.props(styles.metadataItem)}
									>
										Unreviewed
									</span>
								) : (
									<>
										{reviewCard.freshness_tier !== null ? (
											<span
												{...stylex.props(
													styles.metadataItem,
												)}
											>
												{reviewCard.freshness_tier}
											</span>
										) : null}
										{reviewCard.next_due_at !== null ? (
											<span
												{...stylex.props(
													styles.metadataItem,
												)}
											>{`Due ${formatRelativeDate(reviewCard.next_due_at)}`}</span>
										) : null}
										<span
											{...stylex.props(
												styles.metadataItem,
											)}
										>
											<Check size={iconSizes.md} />
											{formatRelativeDate(
												reviewCard.last_reviewed_at,
											)}
										</span>
										{reviewCard.stability !== null ? (
											<span
												{...stylex.props(
													styles.metadataItem,
												)}
											>
												Durable for{' '}
												{Math.round(
													reviewCard.stability,
												)}
												d
											</span>
										) : null}
									</>
								)}
							</div>
							<div {...stylex.props(styles.actions)}>
								{reviewCard.type === 'flashcard' ? (
									<Button.Icon
										aria-label='Unflashcard'
										disabled
										shape='round'
										variant='ghost'
										size='small'
									>
										<Zap
											aria-hidden='true'
											size={iconSizes.md}
											{...stylex.props(
												styles.flashcardOn,
											)}
										/>
									</Button.Icon>
								) : null}
								{reviewCard.flagged_at !== null ? (
									<Button.Icon
										aria-label='Unflag'
										disabled
										shape='round'
										variant='ghost'
										size='small'
									>
										<Flag
											aria-hidden='true'
											size={iconSizes.md}
											{...stylex.props(styles.flagOn)}
										/>
									</Button.Icon>
								) : null}
								<DropdownMenu>
									<DropdownMenuTrigger
										render={
											<Button.Icon
												aria-label='Review card actions'
												shape='round'
												variant='ghost'
												size='small'
											/>
										}
									>
										<Ellipsis
											aria-hidden='true'
											size={iconSizes.md}
										/>
									</DropdownMenuTrigger>
									<DropdownMenuContent align='end'>
										<DropdownMenuItem disabled>
											<Zap
												aria-hidden='true'
												size={iconSizes.md}
												{...(reviewCard.type ===
												'flashcard'
													? stylex.props(
															styles.flashcardOn,
														)
													: {})}
											/>
											{reviewCard.type === 'flashcard'
												? 'Unflashcard'
												: 'Flashcard'}
										</DropdownMenuItem>
										<DropdownMenuItem disabled>
											<Flag
												aria-hidden='true'
												size={iconSizes.md}
												{...(reviewCard.flagged_at !==
												null
													? stylex.props(
															styles.flagOn,
														)
													: {})}
											/>
											{reviewCard.flagged_at !== null
												? 'Unflag'
												: 'Flag'}
										</DropdownMenuItem>
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
						</div>
						<Separator />
					</div>
					<Hideable
						revealed={hideMode === 'off' || notesRevealed}
						onRevealedChange={setNotesRevealed}
						xstyle={styles.notesContainer}
					>
						<Textarea
							aria-label='Review-card notes'
							readOnly
							value={reviewCard.notes}
							xstyle={styles.notes}
						/>
					</Hideable>
				</div>
			</main>
			<aside>
				<ReviewsSidebar />
			</aside>
		</div>
	)
}
