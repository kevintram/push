import * as stylex from '@stylexjs/stylex'
import {
	formatForDisplay,
	type Hotkey,
	useHotkey,
} from '@tanstack/react-hotkeys'
import type { FormEvent } from 'react'
import { useEffect, useRef } from 'react'

import {
	Button,
	Kbd,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'

import { RatingPicker } from './RatingPicker'
import { useReviewComposerState } from './reviewComposerContext'
import { ReviewDatePicker } from './ReviewDatePicker'

const CREATE_REVIEW_HOTKEY = 'Mod+Enter' satisfies Hotkey

const styles = stylex.create({
	composer: {
		columnGap: spacing.sm,
		rowGap: spacing.sm,

		padding: 0,
		marginInline: 0,

		blockSize: '100%',
		display: 'grid',
		gridTemplateColumns: 'max-content minmax(0, 1fr)',
		gridTemplateRows: 'minmax(0, 1fr) auto',
		inlineSize: '100%',
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
		flexBasis: 0,
		flexGrow: 1,
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
		lineHeight: 1.4,
		minBlockSize: 0,
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
})

type ReviewComposerProps = {
	/** The control to focus when the composer mounts. */
	autoFocus?: 'description' | 'rating'
}

/**
 * Fills its container. Cancelling belongs to the window around it, such as
 * the docked composer or its dialog.
 */
export function ReviewComposer({ autoFocus }: ReviewComposerProps) {
	const formRef = useRef<HTMLFormElement>(null)
	const descriptionRef = useRef<HTMLTextAreaElement>(null)
	const ratingRef = useRef<HTMLButtonElement>(null)
	const {
		draft,
		isDirty,
		isPending,
		setDescription,
		setNotes,
		setRating,
		setDate,
		submit,
	} = useReviewComposerState()
	const isSubmitDisabled = !isDirty || isPending

	useEffect(() => {
		if (autoFocus === 'description') descriptionRef.current?.focus()
		else if (autoFocus === 'rating') ratingRef.current?.focus()
	}, [autoFocus])

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (!isSubmitDisabled) submit()
	}

	const submitWithHotkey = () => formRef.current?.requestSubmit()
	useHotkey(CREATE_REVIEW_HOTKEY, submitWithHotkey, {
		enabled: !isSubmitDisabled,
		target: formRef,
	})

	return (
		<form
			aria-label='Add review'
			onSubmit={handleSubmit}
			ref={formRef}
			{...stylex.props(styles.composer)}
		>
			<aside {...stylex.props(styles.rail)}>
				<div {...stylex.props(styles.ratingControl)}>
					<RatingPicker
						disabled={isPending}
						onSetRating={setRating}
						rating={draft.rating ?? undefined}
						ref={ratingRef}
					/>
				</div>
			</aside>
			<div {...stylex.props(styles.editor)}>
				<Textarea
					aria-label='Review description'
					disabled={isPending}
					onChange={event => setDescription(event.target.value)}
					placeholder='Description'
					value={draft.description}
					ref={descriptionRef}
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
						emptyLabel='Date'
						kind={draft.rating === null ? 'scheduled' : 'completed'}
						onDateChange={setDate}
						size='medium'
					/>
				</div>
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								shape='round'
								disabled={isSubmitDisabled}
								type='submit'
							>
								Create review
							</Button>
						}
					/>
					<TooltipContent>
						Create review
						<Kbd>{formatForDisplay(CREATE_REVIEW_HOTKEY)}</Kbd>
					</TooltipContent>
				</Tooltip>
			</footer>
		</form>
	)
}
