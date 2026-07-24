import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams, useRouter } from '@tanstack/react-router'
import { Check, Ellipsis, Flag, Trash2, Zap } from 'lucide-react'
import { useCallback, useState } from 'react'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
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
import { useAutoSave } from '~/hooks/useAutoSave'
import { useDeleteReviewCard } from '~/modules/reviews/api/deleteReviewCard'
import { reviewCardQueries } from '~/modules/reviews/api/queries'
import { useUpdateReviewCard } from '~/modules/reviews/api/updateReviewCard'
import { ReviewsSidebar } from '~/modules/reviews/components/ReviewsSidebar'
import {
	amberDark,
	amberLight,
	orangeDark,
	orangeLight,
} from '~/styles/colorPrimitives.stylex'
import { colors } from '~/styles/colors.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	spacing,
} from '~/styles/tokens.stylex'
import { formatRelativeDate } from '~/utils/date'

const DARK = '@media (prefers-color-scheme: dark)'

const styles = stylex.create({
	container: {
		display: 'flex',

		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
	},
	main: {
		padding: spacing.xl,
		gap: spacing.xs,

		display: 'flex',
		flexDirection: 'column',

		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
	},
	primary: {
		fontSize: fontSizes.xl,
		fontWeight: fontWeights.bold,
	},
	secondary: { fontSize: fontSizes.md },
	footer: {
		gap: spacing.md,
		alignItems: 'center',
		display: 'flex',
	},
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
		fill: { [DARK]: amberDark.s9, default: amberLight.s9 },
		color: { [DARK]: amberDark.s9, default: amberLight.s9 },
	},
	flagOn: {
		fill: { [DARK]: orangeDark.s9, default: orangeLight.s9 },
		color: { [DARK]: orangeDark.s9, default: orangeLight.s9 },
	},
	separatorGroup: {
		marginBlock: spacing.xl,

		gap: spacing.sm,
		display: 'flex',
		flexDirection: 'column',
	},
	notesContainer: {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
	},
	notes: {
		blockSize: '100%',
		inlineSize: '100%',

		fontSize: fontSizes.md,
	},
})

export function ReviewCardPageOverview() {
	const { reviewCardId } = useParams({
		from: '/review-cards/$reviewCardId',
	})
	const { data: reviewCard } = useSuspenseQuery(
		reviewCardQueries.detail(reviewCardId),
	)
	const { mutate } = useUpdateReviewCard()
	const router = useRouter()
	const { isPending: isDeleting, mutateAsync: deleteReviewCard } =
		useDeleteReviewCard()
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	const save = useCallback(
		(field: 'primary_text' | 'secondary_text' | 'notes', value: string) => {
			if (value === reviewCard[field]) return
			mutate({ id: reviewCard.id, [field]: value })
		},
		[mutate, reviewCard],
	)
	const primary = useAutoSave({
		initialValue: reviewCard.primary_text,
		onSave: value => save('primary_text', value),
		key: `review-card-primary-${reviewCard.id}`,
	})
	const secondary = useAutoSave({
		initialValue: reviewCard.secondary_text,
		onSave: value => save('secondary_text', value),
		key: `review-card-secondary-${reviewCard.id}`,
	})
	const notes = useAutoSave({
		initialValue: reviewCard.notes,
		onSave: value => save('notes', value),
		key: `review-card-notes-${reviewCard.id}`,
	})

	const targetType = reviewCard.type === 'practice' ? 'flashcard' : 'practice'

	const toggleFlag = () =>
		mutate({ id: reviewCard.id, flagged: reviewCard.flagged_at === null })
	const toggleType = () => mutate({ id: reviewCard.id, type: targetType })

	const confirmDelete = async () => {
		try {
			await deleteReviewCard(reviewCard.id)
		} catch {
			return
		}
		setIsDeleteDialogOpen(false)
		router.history.back()
	}

	const isUnreviewed = reviewCard.last_reviewed_at === null

	return (
		<div {...stylex.props(styles.container)}>
			<main {...stylex.props(styles.main)}>
				<Textarea
					aria-label='Review-card primary text'
					placeholder='Primary text'
					value={primary.value}
					onChange={primary.onChange}
					onBlur={primary.flush}
					xstyle={styles.primary}
				/>
				<Textarea
					aria-label='Review-card secondary text'
					placeholder='Secondary text'
					value={secondary.value}
					onChange={secondary.onChange}
					onBlur={secondary.flush}
					xstyle={styles.secondary}
				/>

				<div {...stylex.props(styles.separatorGroup)}>
					<div {...stylex.props(styles.footer)}>
						<div {...stylex.props(styles.metadata)}>
							{isUnreviewed ? (
								<span {...stylex.props(styles.metadataItem)}>
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
										>
											{`Due ${formatRelativeDate(reviewCard.next_due_at)}`}
										</span>
									) : null}
									{reviewCard.last_reviewed_at !== null ? (
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
									) : null}
									{reviewCard.stability !== null ? (
										<span
											{...stylex.props(
												styles.metadataItem,
											)}
										>
											Durable for{' '}
											{Math.round(reviewCard.stability)}d
										</span>
									) : null}
								</>
							)}
						</div>

						<div {...stylex.props(styles.actions)}>
							{reviewCard.type === 'flashcard' ? (
								<Button.Icon
									aria-label='Unflashcard'
									shape='round'
									variant='ghost'
									size='small'
									onClick={toggleType}
								>
									<Zap
										aria-hidden='true'
										size={iconSizes.md}
										{...stylex.props(styles.flashcardOn)}
									/>
								</Button.Icon>
							) : null}
							{reviewCard.flagged_at !== null ? (
								<Button.Icon
									aria-label='Unflag'
									shape='round'
									variant='ghost'
									size='small'
									onClick={toggleFlag}
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
									<DropdownMenuItem onClick={toggleType}>
										<Zap
											aria-hidden='true'
											size={iconSizes.md}
											{...(reviewCard.type === 'flashcard'
												? stylex.props(
														styles.flashcardOn,
													)
												: {})}
										/>
										{reviewCard.type === 'flashcard'
											? 'Unflashcard'
											: 'Flashcard'}
									</DropdownMenuItem>
									<DropdownMenuItem onClick={toggleFlag}>
										<Flag
											aria-hidden='true'
											size={iconSizes.md}
											{...(reviewCard.flagged_at !== null
												? stylex.props(styles.flagOn)
												: {})}
										/>
										{reviewCard.flagged_at !== null
											? 'Unflag'
											: 'Flag'}
									</DropdownMenuItem>
									<DropdownMenuItem
										disabled={isDeleting}
										onClick={() =>
											setIsDeleteDialogOpen(true)
										}
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
					</div>

					<Separator />
				</div>

				<Hideable key={reviewCardId} xstyle={styles.notesContainer}>
					<Textarea
						aria-label='Review-card notes'
						placeholder='Add notes'
						value={notes.value}
						onChange={notes.onChange}
						onBlur={notes.flush}
						xstyle={styles.notes}
					/>
				</Hideable>
			</main>
			<aside>
				<ReviewsSidebar />
			</aside>

			<DeleteConfirmationDialog
				description='This will delete this review card and all linked reviews.'
				isPending={isDeleting}
				onConfirm={() => void confirmDelete()}
				onOpenChange={setIsDeleteDialogOpen}
				open={isDeleteDialogOpen}
				title='Delete review card?'
			/>
		</div>
	)
}
