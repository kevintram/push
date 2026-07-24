import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { Check, Ellipsis, Flag, Trash2, Zap } from 'lucide-react'
import { useState } from 'react'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui'
import { useDeleteReviewCard } from '~/modules/reviews/api/deleteReviewCard'
import { useUpdateReviewCard } from '~/modules/reviews/api/updateReviewCard'
import { type ReviewCard } from '~/modules/reviews/types/review.types'
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
		paddingBlock: spacing.lg,
		position: 'relative',

		gap: spacing.md,
		display: 'flex',
		flexDirection: 'column',

		borderBottomColor: colors.borderSecondary,
		borderBottomStyle: 'solid',
		borderBottomWidth: '1px',

		color: colors.text,
	},
	title: {
		fontSize: fontSizes.md,
		fontWeight: fontWeights.semibold,

		textDecoration: 'none',
		color: colors.text,

		// Stretched-link overlay: makes the whole card a click target for this
		// link while keeping full anchor semantics (keyboard, cmd-click, copy).
		'::after': {
			inset: 0,
			content: '""',
			position: 'absolute',
		},
	},
	description: {
		fontSize: fontSizes.sm,
	},
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
		// Sits above the stretched-link overlay so it captures its own clicks.
		gap: spacing.xs,
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
		position: 'relative',
		zIndex: 1,
	},
	flashcardOn: {
		fill: { [DARK]: amberDark.s9, default: amberLight.s9 },
		color: { [DARK]: amberDark.s9, default: amberLight.s9 },
	},
	flagOn: {
		fill: { [DARK]: orangeDark.s9, default: orangeLight.s9 },
		color: { [DARK]: orangeDark.s9, default: orangeLight.s9 },
	},
})

export function ReviewCard({
	id,
	type,
	primary_text,
	secondary_text,
	stability,
	last_reviewed_at,
	next_due_at,
	freshness_tier,
	flagged_at,
}: ReviewCard) {
	const { mutate: updateReviewCard } = useUpdateReviewCard()
	const { isPending: isDeleting, mutateAsync: deleteReviewCard } =
		useDeleteReviewCard()
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	const targetType = type === 'practice' ? 'flashcard' : 'practice'

	const toggleFlag = () =>
		updateReviewCard({ id, flagged: flagged_at === null })
	const toggleType = () => updateReviewCard({ id, type: targetType })

	const confirmDelete = async () => {
		try {
			await deleteReviewCard(id)
		} catch {
			return
		}
		setIsDeleteDialogOpen(false)
	}

	const isUnreviewed = last_reviewed_at === null

	return (
		<div {...stylex.props(styles.container)}>
			<Link
				to='/review-cards/$reviewCardId'
				params={{ reviewCardId: id }}
				{...stylex.props(styles.title)}
			>
				{primary_text}
			</Link>

			{secondary_text ? (
				<p {...stylex.props(styles.description)}>{secondary_text}</p>
			) : null}

			<div {...stylex.props(styles.footer)}>
				<div {...stylex.props(styles.metadata)}>
					{isUnreviewed ? (
						<span {...stylex.props(styles.metadataItem)}>
							Unreviewed
						</span>
					) : (
						<>
							{freshness_tier !== null ? (
								<span {...stylex.props(styles.metadataItem)}>
									{freshness_tier}
								</span>
							) : null}
							{next_due_at !== null ? (
								<span {...stylex.props(styles.metadataItem)}>
									{`Due ${formatRelativeDate(next_due_at)}`}
								</span>
							) : null}
							{last_reviewed_at !== null ? (
								<span {...stylex.props(styles.metadataItem)}>
									<Check size={iconSizes.md} />
									{formatRelativeDate(last_reviewed_at)}
								</span>
							) : null}
							{stability !== null ? (
								<span {...stylex.props(styles.metadataItem)}>
									Durable for {Math.round(stability)}d
								</span>
							) : null}
						</>
					)}
				</div>

				<div {...stylex.props(styles.actions)}>
					{type === 'flashcard' ? (
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
					{flagged_at !== null ? (
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
							<Ellipsis aria-hidden='true' size={iconSizes.md} />
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuItem onClick={toggleType}>
								<Zap
									aria-hidden='true'
									size={iconSizes.md}
									{...(type === 'flashcard'
										? stylex.props(styles.flashcardOn)
										: {})}
								/>
								{type === 'flashcard'
									? 'Unflashcard'
									: 'Flashcard'}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={toggleFlag}>
								<Flag
									aria-hidden='true'
									size={iconSizes.md}
									{...(flagged_at !== null
										? stylex.props(styles.flagOn)
										: {})}
								/>
								{flagged_at !== null ? 'Unflag' : 'Flag'}
							</DropdownMenuItem>
							<DropdownMenuItem
								disabled={isDeleting}
								onClick={() => setIsDeleteDialogOpen(true)}
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
