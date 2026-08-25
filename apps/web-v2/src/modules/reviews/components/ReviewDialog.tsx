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
import { topicQueries } from '~/modules/library/api/topicQueries'
import { reviewCardQueries } from '~/modules/reviews/api/reviewCardQueries'
import { dialogColors, reviewColors } from '~/styles/colors/components.stylex'
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
			default: '13dvh',
			'@media (max-width: 767px)':
				'max(8px, env(safe-area-inset-bottom))',
		},
		paddingBlockStart: {
			default: '13dvh',
			'@media (max-width: 767px)': 'max(8px, env(safe-area-inset-top))',
		},
		paddingInlineEnd: {
			default: '12px',
			'@media (max-width: 767px)': 'max(8px, env(safe-area-inset-right))',
		},
		paddingInlineStart: {
			default: '12px',
			'@media (max-width: 767px)': 'max(8px, env(safe-area-inset-left))',
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
			default: '6dvh',
			'@media (max-width: 767px)':
				'max(8px, env(safe-area-inset-bottom))',
		},
		paddingBlockStart: {
			default: '6dvh',
			'@media (max-width: 767px)': 'max(8px, env(safe-area-inset-top))',
		},
	},
	popup: {
		gap: spacing.sm,
		overflow: 'hidden',
		paddingBlock: spacing.md,
		paddingInline: spacing.md,
		backgroundColor: dialogColors.fullscreenBackground,
		display: 'flex',
		flexDirection: 'column',
		inlineSize: '100%',
		maxBlockSize: {
			default: '74dvh',
			'@media (max-width: 767px)': '100%',
		},
		maxInlineSize: {
			default: '750px',
			'@media (max-width: 767px)': 'none',
		},
		minBlockSize: 0,
		minInlineSize: 0,

		blockSize: {
			default: 'auto',
			'@media (max-width: 767px)': '100%',
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
			default: '88dvh',
			'@media (max-width: 767px)': '100%',
		},
		maxBlockSize: {
			default: '88dvh',
			'@media (max-width: 767px)': '100%',
		},
		maxInlineSize: {
			default: '820px',
			'@media (max-width: 767px)': 'none',
		},
		minBlockSize: {
			default: '88dvh',
			'@media (max-width: 767px)': 0,
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
			default: 'minmax(0, auto) auto',
			'@media (max-width: 767px)': 'minmax(0, 1fr) auto',
		},

		overflow: 'hidden',
		display: 'grid',
		flexBasis: {
			default: 'auto',
			'@media (max-width: 767px)': 0,
		},
		flexGrow: {
			default: 0,
			'@media (max-width: 767px)': 1,
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
		backgroundColor: reviewColors.rowBackground,
	},
	editor: {
		gap: spacing.sm,
		overflow: 'hidden',
		display: 'flex',
		flexBasis: {
			default: 'auto',
			'@media (max-width: 767px)': 0,
		},
		flexDirection: 'column',
		flexGrow: {
			default: 0,
			'@media (max-width: 767px)': 1,
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
			default: 'auto',
			'@media (max-width: 767px)': 0,
		},
		flexGrow: {
			default: 0,
			'@media (max-width: 767px)': 1,
		},
		flexShrink: 1,
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
		lineHeight: 1.4,
		minBlockSize: {
			default: '5rem',
			'@media (max-width: 767px)': 0,
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
	onDelete: () => void
	onSetDate: (value: DateString | null) => void
	onSetRating: (rating: Rating | null) => void
	review: Review
}

export function ReviewDialog({
	descriptionField,
	isOpen,
	notesField,
	onDelete,
	onSetDate,
	onSetRating,
	review,
}: ReviewDialogProps) {
	const [isExpanded, setIsExpanded] = useState(false)

	useEffect(() => {
		if (!isOpen) setIsExpanded(false)
	}, [isOpen])

	const { data: reviewCard } = useQuery({
		...reviewCardQueries.detail(review.reviewCardId),
		enabled: isOpen,
	})
	const topicId = reviewCard?.topicId
	const { data: topic } = useQuery({
		...topicQueries.detail(topicId ?? ('' as Id<'topics'>), {
			expandPath: true,
		}),
		enabled: isOpen && topicId !== undefined,
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
					reviewCard={reviewCard}
					reviewCardId={review.reviewCardId}
					topic={topic}
				/>
				<div {...stylex.props(styles.headerActions)}>
					<Button.Icon
						aria-expanded={isExpanded}
						aria-label={
							isExpanded ? 'Collapse review' : 'Expand review'
						}
						onClick={() => setIsExpanded(expanded => !expanded)}
						xstyle={styles.windowControl}
						shape='round'
						size='micro'
						variant='ghost'
					>
						{isExpanded ? (
							<Minimize2 aria-hidden='true' size={iconSizes.md} />
						) : (
							<Maximize2 aria-hidden='true' size={iconSizes.md} />
						)}
					</Button.Icon>
					<DialogClose
						render={
							<Button.Icon
								aria-label='Close review'
								shape='round'
								size='micro'
								variant='ghost'
							/>
						}
					>
						<X aria-hidden='true' size={iconSizes.md} />
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
							isCompleted={review.rating !== undefined}
							onChange={onSetDate}
							size='medium'
							value={(review.date ?? null) as DateString | null}
						/>
						<ReviewDurability review={review} size='medium' />
					</div>
					<div {...stylex.props(styles.footerActions)}>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button.Icon
										aria-label='Review actions'
										shape='round'
										size='micro'
										variant='ghost'
									/>
								}
							>
								<Ellipsis
									aria-hidden='true'
									size={iconSizes.md}
								/>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuItem onClick={onDelete}>
									<Trash2
										aria-hidden='true'
										size={iconSizes.md}
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
