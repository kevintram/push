import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { Check, Ellipsis, Flag, Trash2, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Hideable } from '~/components/Hideable'
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui'
import { type ReviewCard } from '~/modules/reviews/types/review.types'
import { useHideMode } from '~/stores/HideMode'
import { colors } from '~/styles/colors.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	spacing,
} from '~/styles/tokens.stylex'
import { formatRelativeDate } from '~/utils/date'

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

		// Stretched-link trick
		'::after': {
			inset: 0,
			content: '""',
			position: 'absolute',
		},
	},
	raised: {
		// Create seperate z-index context so streched-link
		// overlay doesn't capture interactins
		position: 'relative',
		zIndex: 1,
	},
	secondaryText: {
		paddingBlock: spacing.sm,
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
	const { hideMode } = useHideMode()

	const [secondaryRevealed, setSecondaryRevealed] = useState(false)

	const isUnreviewed = last_reviewed_at === null

	const secondaryShown =
		type === 'practice' || // always show if practice
		hideMode === 'off' || // always show if hideMode off
		secondaryRevealed

	useEffect(() => {
		// reset secondaryRevealed
		setSecondaryRevealed(false)
	}, [hideMode, id])

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
				<Hideable
					revealed={secondaryShown}
					onRevealedChange={setSecondaryRevealed}
					// Only raise while hidden so the Reveal button stays
					// clickable; once revealed, let the answer text fall
					// under the stretched link so the card stays navigable.
					xstyle={secondaryShown ? undefined : styles.raised}
				>
					<p {...stylex.props(styles.secondaryText)}>
						{secondary_text}
					</p>
				</Hideable>
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

				<div {...stylex.props(styles.actions, styles.raised)}>
					{type === 'flashcard' ? (
						<Button.Icon
							aria-label='Unflashcard'
							shape='round'
							variant='ghost'
							size='small'
							disabled
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
							disabled
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
							<DropdownMenuItem disabled>
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
							<DropdownMenuItem disabled>
								<Flag
									aria-hidden='true'
									size={iconSizes.md}
									{...(flagged_at !== null
										? stylex.props(styles.flagOn)
										: {})}
								/>
								{flagged_at !== null ? 'Unflag' : 'Flag'}
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
		</div>
	)
}
