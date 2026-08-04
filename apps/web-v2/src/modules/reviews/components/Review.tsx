import * as stylex from '@stylexjs/stylex'
import {
	Check,
	CheckCheck,
	Circle,
	Construction,
	Ellipsis,
	File,
	Trash2,
	X,
} from 'lucide-react'
import { useState } from 'react'

import {
	Button,
	Dialog,
	DialogContent,
	DialogTrigger,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
	Textarea,
} from '~/components/ui'
import { colors } from '~/styles/colors.stylex'
import { fontSizes, iconSizes, radii, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import type { Review as ReviewModel } from '../types/review.types'
import { ReviewDatePicker } from './ReviewDatePicker'

const styles = stylex.create({
	contentContainer: {
		gridTemplateAreas: `
			'rating description'
			'empty footer'
		`,
		display: 'grid',
		gridTemplateColumns: 'auto 1fr',
		gridTemplateRows: 'auto auto',
		position: 'relative',

		backgroundColor: colors.bgSurfaceTransparent,
		cursor: 'pointer',
	},
	rating: {
		gridColumnEnd: 'rating',
		gridColumnStart: 'rating',
		gridRowEnd: 'rating',
		gridRowStart: 'rating',

		alignSelf: 'center',

		paddingInline: spacing.xs,
	},
	ratingBadge: {
		borderRadius: radii.full,
		alignItems: 'center',
		backgroundColor: colors.bgFillBrand,
		blockSize: iconSizes.md,
		color: colors.textBrandOnBgFill,
		display: 'flex',
		flexShrink: 0,
		inlineSize: iconSizes.md,
		justifyContent: 'center',
	},
	description: {
		gridColumnEnd: 'description',
		gridColumnStart: 'description',
		gridRowEnd: 'description',
		gridRowStart: 'description',

		paddingBlock: spacing.xs,
		paddingInlineStart: spacing.sm,

		alignItems: 'center',
		columnGap: '6px',
		display: 'flex',
		minInlineSize: 0,

		fontSize: fontSizes.sm,
		textAlign: 'start',

		backgroundColor: colors.bgSurfaceTransparent,
		color: colors.text,
		cursor: 'pointer',

		borderWidth: 0,

		// stretched link trick
		'::after': {
			inset: 0,
			content: '""',
			position: 'absolute',
		},
	},
	raised: {
		position: 'relative',
		zIndex: 1,
	},
	descriptionText: {
		overflow: 'hidden',
		minInlineSize: 0,
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	notesIndicator: {
		blockSize: iconSizes.md,
		color: colors.textSecondary,
		flexShrink: 0,
		inlineSize: iconSizes.md,
	},
	footer: {
		gridColumnEnd: 'footer',
		gridColumnStart: 'footer',
		gridRowEnd: 'footer',
		gridRowStart: 'footer',

		paddingBlockStart: spacing.xs,
		paddingInlineStart: spacing.sm,

		alignItems: 'center',
		columnGap: spacing.md,
		display: 'flex',
		minInlineSize: 0,

		fontSize: fontSizes.sm,
	},
	spacer: {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
	},
	more: {
		flexShrink: 0,
		marginInlineStart: 'auto',
	},
	descriptionEditor: { minBlockSize: '96px' },
	notesEditor: { minBlockSize: '96px' },
})

const ratings = {
	miss: { label: 'Miss', Icon: X },
	hard: { label: 'Hard', Icon: Construction },
	good: { label: 'Good', Icon: Check },
	easy: { label: 'Easy', Icon: CheckCheck },
} as const

export function Review({ review }: { review: ReviewModel }) {
	const [isOpen, setIsOpen] = useState(false)

	const rating = !review.rating ? null : ratings[review.rating]
	const RatingIcon = rating?.Icon ?? Circle
	const description = review.description.trim()
	const hasNotes = review.notes.trim().length > 0

	return (
		<>
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<div {...stylex.props(styles.contentContainer)}>
					<DropdownMenu>
						<DropdownMenuTrigger
							aria-label={rating?.label ?? 'Uncompleted'}
							render={
								<Button.Icon
									shape='round'
									size='micro'
									variant='ghost'
									xstyle={[styles.rating, styles.raised]}
								/>
							}
						>
							{!review.rating ? (
								<RatingIcon
									aria-hidden='true'
									size={iconSizes.md}
								/>
							) : (
								<span {...stylex.props(styles.ratingBadge)}>
									<RatingIcon
										aria-hidden='true'
										size={iconSizes.sm}
									/>
								</span>
							)}
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuRadioGroup value={review.rating ?? ''}>
								<DropdownMenuRadioItem
									value=''
									disabled
									prefix={
										<Circle
											aria-hidden='true'
											size={iconSizes.md}
										/>
									}
								>
									Uncompleted
								</DropdownMenuRadioItem>
								{Object.entries(ratings).map(
									([value, { label, Icon }]) => (
										<DropdownMenuRadioItem
											key={value}
											value={value}
											disabled
											prefix={
												<Icon
													aria-hidden='true'
													size={iconSizes.md}
												/>
											}
										>
											{label}
										</DropdownMenuRadioItem>
									),
								)}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
					<DialogTrigger {...stylex.props(styles.description)}>
						<span {...stylex.props(styles.descriptionText)}>
							{description || 'No description'}
						</span>
						{hasNotes && (
							<File
								aria-label='Has notes'
								{...stylex.props(styles.notesIndicator)}
							/>
						)}
					</DialogTrigger>
					<div {...stylex.props(styles.footer)}>
						<div {...stylex.props(styles.raised)}>
							<ReviewDatePicker
								disabled
								isCompleted={review.completedAt !== undefined}
								value={
									(review.completedAt ??
										review.scheduledAt ??
										null) as DateString | null
								}
							/>
						</div>
						<div {...stylex.props(styles.spacer)} />
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button.Icon
										aria-label='Review actions'
										shape='round'
										size='micro'
										variant='ghost'
										xstyle={[styles.more, styles.raised]}
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

				<DialogContent>
					<Textarea
						aria-label='Review description'
						placeholder='Add a description…'
						readOnly
						value={review.description}
						xstyle={styles.descriptionEditor}
					/>
					<Textarea
						aria-label='Review notes'
						placeholder='Add notes…'
						readOnly
						value={review.notes}
						xstyle={styles.notesEditor}
					/>
				</DialogContent>
			</Dialog>
		</>
	)
}
