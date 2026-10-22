import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { Ellipsis, Maximize2, Minimize2, Trash2, X } from 'lucide-react'
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
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
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
import { RatingPicker } from './RatingPicker'
import { ReviewDatePicker } from './ReviewDatePicker'
import { ReviewDialogBreadcrumbs } from './ReviewDialogBreadcrumbs'
import { ReviewDurability } from './ReviewDurability'

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
	content: {
		gridTemplateAreas: `
			'rail editor'
			'rail footer'
		`,
		columnGap: spacing.md,
		gridTemplateColumns: 'max-content minmax(0, 1fr)',
		gridTemplateRows: {
			default: 'minmax(0, 1fr) auto',
			[breakpoints.tablet]: 'minmax(0, auto) auto',
		},

		overflow: 'hidden',
		display: 'grid',
		flexBasis: {
			default: 0,
			[breakpoints.tablet]: 'auto',
		},
		flexGrow: {
			default: 1,
			[breakpoints.tablet]: 0,
		},
		flexShrink: 1,
		minBlockSize: 0,
		minInlineSize: 0,
	},
	expandedContent: {
		flexBasis: 0,
		flexGrow: 1,
		gridTemplateRows: 'minmax(0, 1fr) auto',
	},
	rail: {
		alignItems: 'flex-start',
		display: 'flex',
		flexDirection: 'column',
		gridColumnEnd: '2',
		gridColumnStart: '1',
		gridRowEnd: '-1',
		gridRowStart: '1',
		minBlockSize: 0,
		minInlineSize: 0,
	},
	ratingControl: {
		borderRadius: radii.md,
		alignSelf: 'flex-start',
		backgroundColor: colorsSemantic.surfaceTransparent,
	},
	editor: {
		gap: spacing.sm,
		overflow: 'hidden',
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
		flexShrink: 1,
		gridColumnEnd: '3',
		gridColumnStart: '2',
		gridRowEnd: '2',
		gridRowStart: '1',
		minBlockSize: 0,
		minInlineSize: 0,
	},
	expandedEditor: {
		flexBasis: 0,
		flexGrow: 1,
	},
	description: {
		borderRadius: radii.xs,
		borderStyle: 'none',
		blockSize: 'auto',
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
		lineHeight: 1.4,
		marginBlockStart: '4px', // magic number because it *is* a magic number
		maxBlockSize: 'calc(1.4em * 6)',
		overflowWrap: 'anywhere',
		overflowX: 'hidden',
		overflowY: 'auto',
	},
	notes: {
		borderRadius: radii.xs,
		borderStyle: 'none',
		blockSize: 'auto',
		flexBasis: {
			default: 0,
			[breakpoints.tablet]: 'auto',
		},
		flexGrow: {
			default: 1,
			[breakpoints.tablet]: 0,
		},
		flexShrink: 1,
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
		lineHeight: 1.4,
		minBlockSize: {
			default: 0,
			[breakpoints.tablet]: '5rem',
		},
		overflowWrap: 'anywhere',
		overflowX: 'hidden',
		overflowY: 'auto',
	},
	expandedNotes: {
		flexBasis: 0,
		flexGrow: 1,
		minBlockSize: 0,
	},
	footer: {
		alignItems: 'center',
		columnGap: spacing.sm,
		display: 'flex',
		flexShrink: 0,
		gridColumnEnd: '3',
		gridColumnStart: '2',
		gridRowEnd: '3',
		gridRowStart: '2',
		justifyContent: 'space-between',
		minBlockSize: spacing.xl,
		minInlineSize: 0,
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
	visuallyHidden: {
		margin: '-1px',
		padding: 0,
		overflow: 'hidden',
		blockSize: '1px',
		clip: 'rect(0, 0, 0, 0)',
		inlineSize: '1px',
		position: 'absolute',
		whiteSpace: 'nowrap',
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
			showCloseButton={false}
			viewportXstyle={[
				styles.viewport,
				isExpanded && styles.expandedViewport,
			]}
			xstyle={[styles.popup, isExpanded && styles.expandedPopup]}
		>
			<DialogTitle xstyle={styles.visuallyHidden}>
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
					styles.content,
					isExpanded && styles.expandedContent,
				)}
			>
				<aside {...stylex.props(styles.rail)}>
					<div {...stylex.props(styles.ratingControl)}>
						<RatingPicker
							onSetRating={onSetRating}
							rating={review.rating}
						/>
					</div>
				</aside>
				<div
					{...stylex.props(
						styles.editor,
						isExpanded && styles.expandedEditor,
					)}
				>
					<Textarea
						aria-label='Review description'
						placeholder='Description'
						value={descriptionField.value}
						onBlur={descriptionField.flush}
						onChange={descriptionField.onChange}
						xstyle={styles.description}
					/>
					<Textarea
						aria-label='Review notes'
						placeholder='Add notes…'
						value={notesField.value}
						onBlur={notesField.flush}
						onChange={notesField.onChange}
						xstyle={[
							styles.notes,
							isExpanded && styles.expandedNotes,
						]}
					/>
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
						<ReviewDurability review={review} size='medium' />
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
								<Ellipsis
									aria-hidden='true'
									size={iconSizes.sm}
								/>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuItem onClick={onDelete}>
									<Trash2
										aria-hidden='true'
										size={iconSizes.sm}
									/>
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</footer>
			</div>
		</DialogContent>
	)
}
