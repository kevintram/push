import * as stylex from '@stylexjs/stylex'
import { useHotkey } from '@tanstack/react-hotkeys'
import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

import { Button, Textarea } from '~/components/ui'
import { appHotkeys } from '~/modules/shortcuts/appHotkeys'
import { ariaKeyShortcuts } from '~/modules/shortcuts/ariaKeyShortcuts'
import { ShortcutKeys } from '~/modules/shortcuts/components/ShortcutKeys'
import { scrollFade } from '~/styles/scrollFade'
import { scrollFadeVars } from '~/styles/scrollFade.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'

import { RatingButtons } from './RatingButtons'
import { useReviewComposerState } from './reviewComposerContext'
import { ReviewDatePicker } from './ReviewDatePicker'

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
	// Unclipped, so the ratings' focus rings show; the editor below scrolls
	// on its own.
	body: {
		gap: spacing.md,
		display: 'flex',
		flexBasis: 0,
		flexDirection: 'column',
		flexGrow: 1,
		minBlockSize: 0,
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
	/**
	 * Where the rating and submit keys listen: the window around the
	 * composer, so they work from anywhere in it. Defaults to the form.
	 */
	hotkeyTarget?: HTMLElement | React.RefObject<HTMLElement | null> | null
}

/**
 * Fills its container. Cancelling belongs to the window around it, such as
 * the docked composer or its dialog.
 */
export function ReviewComposer({
	autoFocus,
	hotkeyTarget,
}: ReviewComposerProps) {
	const formRef = useRef<HTMLFormElement>(null)
	const keyTarget = hotkeyTarget ?? formRef
	const descriptionRef = useRef<HTMLTextAreaElement>(null)
	const ratingRef = useRef<HTMLElement>(null)
	const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
	const {
		clearFocusRequest,
		draft,
		focusRequest,
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

	// Runs after `autoFocus`, so the shortcut that opened the composer decides
	// where focus lands.
	useEffect(() => {
		if (!focusRequest) return
		if (focusRequest === 'date') setIsDatePickerOpen(true)
		else ratingRef.current?.focus()
		clearFocusRequest()
	}, [focusRequest, clearFocusRequest])

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (!isSubmitDisabled) submit()
	}

	const submitWithHotkey = () => formRef.current?.requestSubmit()
	useHotkey(appHotkeys.createReview, submitWithHotkey, {
		enabled: !isSubmitDisabled,
		target: keyTarget,
	})

	return (
		<form
			aria-label='Add review'
			onSubmit={handleSubmit}
			ref={formRef}
			{...stylex.props(styles.composer)}
		>
			<div {...stylex.props(styles.body)}>
				<RatingButtons
					disabled={isPending}
					hotkeyTarget={keyTarget}
					onSetRating={setRating}
					rating={draft.rating ?? undefined}
					ref={ratingRef}
				/>
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
						hotkey={appHotkeys.openDatePicker}
						kind={draft.rating === null ? 'scheduled' : 'completed'}
						onDateChange={setDate}
						onOpenChange={setIsDatePickerOpen}
						open={isDatePickerOpen}
						size='medium'
					/>
				</div>
				<Button
					aria-keyshortcuts={ariaKeyShortcuts(
						appHotkeys.createReview,
					)}
					shape='round'
					disabled={isSubmitDisabled}
					type='submit'
				>
					Create review
					<ShortcutKeys
						aria-hidden
						hotkey={appHotkeys.createReview}
					/>
				</Button>
			</footer>
		</form>
	)
}
