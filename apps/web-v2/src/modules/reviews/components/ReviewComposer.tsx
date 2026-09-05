import * as stylex from '@stylexjs/stylex'
import {
	formatForDisplay,
	type Hotkey,
	useHotkey,
} from '@tanstack/react-hotkeys'
import type { FormEvent } from 'react'
import { useRef } from 'react'

import {
	Button,
	Kbd,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { reviewComposerColors } from '~/styles/colors/components.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'

import { RatingPicker } from './RatingPicker'
import { useReviewComposerState } from './reviewComposerContext'
import { ReviewDatePicker } from './ReviewDatePicker'

const ADD_REVIEW_HOTKEY = 'Mod+Enter' satisfies Hotkey

const styles = stylex.create({
	composer: {
		columnGap: spacing.sm,
		rowGap: spacing.sm,

		padding: spacing.md,
		marginInline: `calc(${spacing.md} * -1)`,

		borderRadius: radii.xl,
		backgroundColor: reviewComposerColors.containerBackground,
		boxShadow: `0 4px 16px ${reviewComposerColors.containerShadow}`,

		display: 'grid',
		gridTemplateColumns: 'max-content minmax(0, 1fr)',
		gridTemplateRows: 'auto auto',
		inlineSize: `calc(100% + (${spacing.md} * 2))`,
		minInlineSize: 0,
	},
	rail: {
		alignItems: 'flex-start',
		display: 'flex',
		gridColumnEnd: '2',
		gridColumnStart: '1',
		gridRowEnd: '3',
		gridRowStart: '1',
		minInlineSize: 0,
	},
	ratingControl: {
		borderRadius: radii.md,
		backgroundColor: reviewComposerColors.containerBackground,
	},
	editor: {
		gap: spacing.sm,
		display: 'flex',
		flexDirection: 'column',
		gridColumnEnd: '3',
		gridColumnStart: '2',
		gridRowEnd: '2',
		gridRowStart: '1',
		minInlineSize: 0,
	},
	description: {
		borderRadius: radii.xs,
		borderStyle: 'none',
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
		lineHeight: 1.4,
		marginBlockStart: '4px',
		maxBlockSize: 'calc(1.4em * 6)',
		overflowWrap: 'anywhere',
		overflowX: 'hidden',
		overflowY: 'auto',
	},
	notes: {
		borderRadius: radii.xs,
		borderStyle: 'none',
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
		lineHeight: 1.4,
		minBlockSize: '5rem',
		overflowWrap: 'anywhere',
		overflowX: 'hidden',
		overflowY: 'auto',
	},
	footer: {
		alignItems: 'center',
		columnGap: spacing.sm,
		display: 'flex',
		flexWrap: 'wrap',
		gridColumnEnd: '3',
		gridColumnStart: '2',
		gridRowEnd: '3',
		gridRowStart: '2',
		justifyContent: 'space-between',
		minInlineSize: 0,
		rowGap: spacing.xs,
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
		alignItems: 'center',
		columnGap: spacing.sm,
		display: 'flex',
		flexShrink: 0,
		marginInlineStart: 'auto',
		whiteSpace: 'nowrap',
	},
})

type ReviewComposerProps = {
	autoFocusDescription?: boolean
	id?: string
	onCancel?: () => void
	onSuccess?: () => void
	xstyle?: stylex.StyleXStyles
}

export function ReviewComposer({
	autoFocusDescription = false,
	id,
	onCancel,
	onSuccess,
	xstyle,
}: ReviewComposerProps) {
	const formRef = useRef<HTMLFormElement>(null)
	const {
		draft,
		isDirty,
		isPending,
		setDescription,
		setNotes,
		setRating,
		setDate,
		resetDraft,
		submit,
	} = useReviewComposerState()
	const isSubmitDisabled = !isDirty || isPending

	const handleCancel = () => {
		resetDraft()
		onCancel?.()
	}

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (!isSubmitDisabled) submit(onSuccess)
	}

	const submitWithHotkey = () => formRef.current?.requestSubmit()
	useHotkey(ADD_REVIEW_HOTKEY, submitWithHotkey, {
		enabled: !isSubmitDisabled,
		target: formRef,
	})

	return (
		<form
			aria-label='Add review'
			id={id}
			onSubmit={handleSubmit}
			ref={formRef}
			{...stylex.props(styles.composer, xstyle)}
		>
			<aside {...stylex.props(styles.rail)}>
				<div {...stylex.props(styles.ratingControl)}>
					<RatingPicker
						disabled={isPending}
						onSetRating={setRating}
						rating={draft.rating ?? undefined}
					/>
				</div>
			</aside>
			<div {...stylex.props(styles.editor)}>
				<Textarea
					aria-label='Review description'
					autoFocus={autoFocusDescription}
					disabled={isPending}
					onChange={event => setDescription(event.target.value)}
					placeholder='Add a review...'
					value={draft.description}
					xstyle={styles.description}
				/>
				<Textarea
					aria-label='Review notes'
					disabled={isPending}
					onChange={event => setNotes(event.target.value)}
					placeholder='Notes'
					value={draft.notes}
					xstyle={styles.notes}
				/>
			</div>
			<footer {...stylex.props(styles.footer)}>
				<div {...stylex.props(styles.footerMetadata)}>
					<ReviewDatePicker
						date={draft.date}
						disabled={isPending}
						emptyLabel={null}
						kind={draft.rating === null ? 'scheduled' : 'completed'}
						onDateChange={setDate}
						size='medium'
					/>
				</div>
				<div {...stylex.props(styles.footerActions)}>
					{(isDirty || onCancel !== undefined) && (
						<Button
							disabled={isPending}
							onClick={handleCancel}
							shape='round'
							type='button'
							variant='ghost'
						>
							Cancel
						</Button>
					)}
					<Tooltip>
						<TooltipTrigger
							render={
								<Button
									shape='round'
									disabled={isSubmitDisabled}
									type='submit'
								>
									Add
								</Button>
							}
						/>
						<TooltipContent>
							Add review
							<Kbd>{formatForDisplay(ADD_REVIEW_HOTKEY)}</Kbd>
						</TooltipContent>
					</Tooltip>
				</div>
			</footer>
		</form>
	)
}
