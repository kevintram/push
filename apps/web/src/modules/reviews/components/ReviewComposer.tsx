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
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { scrollFade } from '~/styles/scrollFade'
import { scrollFadeVars } from '~/styles/scrollFade.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'

import { RatingPicker } from './RatingPicker'
import { useReviewComposerState } from './reviewComposerContext'
import { ReviewDatePicker } from './ReviewDatePicker'

const CREATE_REVIEW_HOTKEY = 'Mod+Enter' satisfies Hotkey

const styles = stylex.create({
	composer: {
		gap: spacing.sm,

		padding: 0,
		marginInline: 0,

		blockSize: '100%',
		display: 'flex',
		flexDirection: 'column',
		inlineSize: '100%',
		minInlineSize: 0,
	},
	body: {
		gap: spacing.md,
		overflow: 'hidden',
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		minBlockSize: 0,
	},
	rail: {
		borderRadius: radii.md,
		alignSelf: 'flex-start',
		backgroundColor: colorsSemantic.surfaceTransparent,
		flexShrink: 0,
	},
	// The description and notes scroll together as one document; the textareas
	// size to their content and never scroll on their own.
	editor: {
		gap: spacing.sm,
		display: 'flex',
		flexBasis: 0,
		flexDirection: 'column',
		flexGrow: 1,
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
		marginBlockStart: '4px',
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
			<div {...stylex.props(styles.body)}>
				<aside {...stylex.props(styles.rail)}>
					<RatingPicker
						disabled={isPending}
						onSetRating={setRating}
						rating={draft.rating ?? undefined}
						ref={ratingRef}
					/>
				</aside>
				<div {...stylex.props(styles.editor, scrollFade.y)}>
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
						placeholder='Add notes…'
						value={draft.notes}
						xstyle={styles.notes}
					/>
				</div>
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
