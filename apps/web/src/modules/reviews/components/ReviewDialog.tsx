import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { Ellipsis, Maximize2, Minimize2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
	Button,
	DialogClose,
	DialogContent,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Textarea,
} from '~/components/ui'
import { collectionQueries } from '~/modules/collections/api/collectionQueries'
import { cardQueries } from '~/modules/reviews/api/cardQueries'
import { a11y } from '~/styles/a11y'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { scrollFade } from '~/styles/scrollFade'
import { scrollFadeVars } from '~/styles/scrollFade.stylex'
import {
	breakpoints,
	fontSizes,
	fontWeights,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import type { useReviewField } from '../hooks/useReviewField'
import type { Rating, Review } from '../types/review.types'
import { RatingButtons } from './RatingButtons'
import { ReviewDatePicker } from './ReviewDatePicker'
import { ReviewDialogBreadcrumbs } from './ReviewDialogBreadcrumbs'
import { ReviewStrength } from './ReviewStrength'

const styles = stylex.create({
	viewport: {
		alignItems: 'flex-start',
		blockSize: '100dvh',
		display: 'flex',
		justifyContent: 'center',
		paddingBlockEnd: {
			default: `max(${spacing.sm}, env(safe-area-inset-bottom))`,
			[breakpoints.tablet]: '13dvh',
		},
		paddingBlockStart: {
			default: `max(${spacing.sm}, env(safe-area-inset-top))`,
			[breakpoints.tablet]: '13dvh',
		},
		paddingInlineEnd: {
			default: `max(${spacing.sm}, env(safe-area-inset-right))`,
			[breakpoints.tablet]: spacing.md,
		},
		paddingInlineStart: {
			default: `max(${spacing.sm}, env(safe-area-inset-left))`,
			[breakpoints.tablet]: spacing.md,
		},
		overflowX: 'hidden',
		overflowY: 'hidden',

		transitionDuration: {
			default: '300ms',
			'@media (prefers-reduced-motion: reduce)': '0ms',
		},
		transitionProperty: 'padding-block-start, padding-block-end',
		transitionTimingFunction: 'cubic-bezier(0.43, 0.07, 0.59, 0.94)',
	},
	expandedViewport: {
		paddingBlockEnd: {
			default: `max(${spacing.sm}, env(safe-area-inset-bottom))`,
			[breakpoints.tablet]: '6dvh',
		},
		paddingBlockStart: {
			default: `max(${spacing.sm}, env(safe-area-inset-top))`,
			[breakpoints.tablet]: '6dvh',
		},
	},
	popup: {
		gap: spacing.sm,
		overflow: 'hidden',
		paddingBlock: spacing.md,
		paddingInline: spacing.md,
		backgroundColor: colorsSemantic.surfacePrimary,
		display: 'flex',
		flexDirection: 'column',
		inlineSize: '100%',
		maxBlockSize: {
			default: '100%',
			[breakpoints.tablet]: '74dvh',
		},
		maxInlineSize: {
			default: 'none',
			[breakpoints.tablet]: '750px',
		},
		minBlockSize: 0,
		minInlineSize: 0,

		blockSize: {
			default: '100%',
			[breakpoints.tablet]: 'auto',
		},
		transitionDuration: {
			default: '300ms, 220ms, 300ms',
			'@media (prefers-reduced-motion: reduce)': '0ms',
		},
		transitionProperty: 'block-size, max-inline-size, min-block-size',
		transitionTimingFunction: 'cubic-bezier(0.43, 0.07, 0.59, 0.94)',
	},
	expandedPopup: {
		blockSize: {
			default: '100%',
			[breakpoints.tablet]: '88dvh',
		},
		maxBlockSize: {
			default: '100%',
			[breakpoints.tablet]: '88dvh',
		},
		maxInlineSize: {
			default: 'none',
			[breakpoints.tablet]: '820px',
		},
		minBlockSize: {
			default: 0,
			[breakpoints.tablet]: '88dvh',
		},
	},
	header: {
		gap: spacing.sm,
		alignItems: 'center',
		justifyContent: 'space-between',

		display: 'flex',
		flexShrink: 0,
		minInlineSize: 0,
	},
	headerActions: {
		gap: spacing.xs,
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
	},
	windowControl: {
		display: {
			default: 'none',
			[breakpoints.tablet]: 'inline-flex',
		},
	},
	// Unclipped, so the ratings' focus rings show; the editor below scrolls
	// on its own.
	body: {
		gap: spacing.md,
		display: 'flex',
		flexBasis: {
			default: 0,
			[breakpoints.tablet]: 'auto',
		},
		flexDirection: 'column',
		flexGrow: {
			default: 1,
			[breakpoints.tablet]: 0,
		},
		minBlockSize: 0,
	},
	expandedBody: {
		flexBasis: 0,
		flexGrow: 1,
	},
	// The description and notes scroll together as one document; the textareas
	// size to their content and never scroll on their own. Sized by its content
	// so the compact dialog fits it, it shrinks and scrolls once out of room.
	editor: {
		gap: spacing.sm,
		display: 'flex',
		flexBasis: 'auto',
		flexDirection: 'column',
		flexGrow: 1,
		minBlockSize: 0,
		scrollPaddingBlockEnd: scrollFadeVars.size,
		scrollPaddingBlockStart: scrollFadeVars.size,
		overflowX: 'hidden',
		overflowY: 'auto',
	},
	description: {
		borderRadius: radii.xs,
		borderStyle: 'none',
		flexShrink: 0,
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
		lineHeight: 1.4,
		marginBlockStart: '4px', // magic number because it *is* a magic number
		overflowWrap: 'anywhere',
	},
	notes: {
		borderRadius: radii.xs,
		borderStyle: 'none',
		flexGrow: 1,
		flexShrink: 0,
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.regular,
		lineHeight: 1.4,
		minBlockSize: '5rem',
		overflowWrap: 'anywhere',
	},
	footer: {
		alignItems: 'center',
		columnGap: spacing.sm,
		display: 'flex',
		flexShrink: 0,
		justifyContent: 'space-between',
		minBlockSize: spacing.xl,
	},
	footerMetadata: {
		alignItems: 'center',
		columnGap: spacing.md,
		display: 'flex',
		flexGrow: 1,
		flexShrink: 1,
		flexWrap: 'wrap',
		minInlineSize: 0,
		rowGap: spacing.xs,
	},
	footerActions: {
		flexShrink: 0,
		marginInlineStart: 'auto',
	},
})

type EditableField = ReturnType<typeof useReviewField>

type ReviewDialogProps = {
	descriptionField: EditableField
	isOpen: boolean
	notesField: EditableField
	/** Closes the dialog, e.g. when a breadcrumb navigates away. */
	onClose: () => void
	onDelete: () => void
	onSetDate: (value: DateString | null) => void
	onSetRating: (rating: Rating | null) => void
	review: Review
}

export function ReviewDialog({
	descriptionField,
	isOpen,
	notesField,
	onClose,
	onDelete,
	onSetDate,
	onSetRating,
	review,
}: ReviewDialogProps) {
	const [isExpanded, setIsExpanded] = useState(false)
	// State, not a ref, so the rating keys register once the popup mounts.
	const [popup, setPopup] = useState<HTMLDivElement | null>(null)

	useEffect(() => {
		if (!isOpen) setIsExpanded(false)
	}, [isOpen])

	const { data: card } = useQuery({
		...cardQueries.detail(review.cardId),
		enabled: isOpen,
	})
	const collectionId = card?.collectionId
	const { data: collection } = useQuery({
		...collectionQueries.detail(collectionId ?? ('' as Id<'collections'>), {
			expandPath: true,
		}),
		enabled: isOpen && collectionId !== undefined,
	})

	return (
		<DialogContent
			ref={setPopup}
			showCloseButton={false}
			viewportXstyle={[
				styles.viewport,
				isExpanded && styles.expandedViewport,
			]}
			xstyle={[styles.popup, isExpanded && styles.expandedPopup]}
		>
			<DialogTitle xstyle={a11y.visuallyHidden}>
				Review editor
			</DialogTitle>
			<header {...stylex.props(styles.header)}>
				<ReviewDialogBreadcrumbs
					card={card}
					cardId={review.cardId}
					collection={collection}
					onNavigate={onClose}
				/>
				<div {...stylex.props(styles.headerActions)}>
					<Button
						aria-expanded={isExpanded}
						aria-label={
							isExpanded ? 'Collapse review' : 'Expand review'
						}
						iconOnly
						onClick={() => setIsExpanded(expanded => !expanded)}
						xstyle={styles.windowControl}
						shape='round'
						size='micro'
						variant='ghost'
					>
						{isExpanded ? (
							<Minimize2 aria-hidden='true' size={iconSizes.sm} />
						) : (
							<Maximize2 aria-hidden='true' size={iconSizes.sm} />
						)}
					</Button>
					<DialogClose
						render={
							<Button
								aria-label='Close review'
								iconOnly
								shape='round'
								size='micro'
								variant='ghost'
							/>
						}
					>
						<X aria-hidden='true' size={iconSizes.sm} />
					</DialogClose>
				</div>
			</header>
			<div
				{...stylex.props(
					styles.body,
					isExpanded && styles.expandedBody,
				)}
			>
				<RatingButtons
					hotkeyTarget={popup}
					onSetRating={onSetRating}
					rating={review.rating}
				/>
				<div {...stylex.props(styles.editor, scrollFade.y)}>
					<Textarea
						aria-label='Review description'
						placeholder='Description'
						value={descriptionField.value}
						onCommit={descriptionField.flush}
						onChange={descriptionField.onChange}
						xstyle={styles.description}
					/>
					<Textarea
						aria-label='Review notes'
						placeholder='Add notes…'
						value={notesField.value}
						onCommit={notesField.flush}
						onChange={notesField.onChange}
						xstyle={styles.notes}
					/>
				</div>
			</div>
			<footer {...stylex.props(styles.footer)}>
				<div {...stylex.props(styles.footerMetadata)}>
					<ReviewDatePicker
						date={(review.date ?? null) as DateString | null}
						kind={
							review.rating === undefined
								? 'scheduled'
								: 'completed'
						}
						onDateChange={onSetDate}
						size='medium'
					/>
					{review.stabilityAfter != null && (
						<ReviewStrength review={review} size='medium' />
					)}
				</div>
				<div {...stylex.props(styles.footerActions)}>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									aria-label='Review actions'
									iconOnly
									shape='round'
									size='micro'
									variant='ghost'
								/>
							}
						>
							<Ellipsis aria-hidden='true' size={iconSizes.sm} />
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuItem onClick={onDelete}>
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</footer>
		</DialogContent>
	)
}
