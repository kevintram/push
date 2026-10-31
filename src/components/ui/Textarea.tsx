import * as stylex from '@stylexjs/stylex'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useCallback, useState } from 'react'

import { appHotkeys } from '~/modules/shortcuts/appHotkeys'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { radii, spacing } from '~/styles/tokens.stylex'

export interface TextareaProps extends Omit<
	React.ComponentProps<'textarea'>,
	'className' | 'style'
> {
	/**
	 * Escape stops editing but keeps focus on the field, so single-key
	 * shortcuts work and a second Escape reaches whatever surrounds it. Turn
	 * it off for a field that ends itself on Escape.
	 */
	stopEditingOnEscape?: boolean
	/** Runs when the user is done with the field: on blur, or on Escape. */
	onCommit?: () => void
	// TODO: remove this maybe?
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	textarea: {
		fieldSizing: 'content',
		borderColor: colorsSemantic.surfaceTransparent,
		// Rounds the focus ring, which follows it.
		borderRadius: radii.xs,
		paddingBlock: spacing.none,
		paddingInline: spacing.none,
		backgroundColor: colorsSemantic.surfaceTransparent,
		color: {
			default: colorsSemantic.textPrimary,
			':disabled': colorsSemantic.textDisabled,
		},
		cursor: { default: 'text', ':disabled': 'not-allowed' },
		display: 'block',
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: 'inherit',
		inlineSize: '100%',
		lineHeight: 'inherit',
		outlineStyle: 'none',
		resize: 'none',
		'::placeholder': { color: colorsSemantic.textSecondary },
	},
	// Not editing: ringed like any focused control while it has focus, and
	// without a caret.
	stopped: {
		caretColor: 'transparent',
		outlineColor: {
			default: colorsSemantic.surfaceTransparent,
			':focus': colorsSemantic.borderFocus,
		},
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	},
})

export function Textarea({
	onBlur,
	onCommit,
	onPointerDown,
	readOnly,
	ref,
	stopEditingOnEscape = true,
	xstyle,
	...props
}: TextareaProps) {
	// State, not a ref, so the keys register once the field mounts.
	const [field, setField] = useState<HTMLTextAreaElement | null>(null)
	// Survives a blur, so focus returned from a dialog the field opened
	// lands where it left off; only a click or Enter edits again.
	const [isStopped, setIsStopped] = useState(false)

	const setRefs = useCallback(
		(node: HTMLTextAreaElement | null) => {
			setField(node)
			if (typeof ref === 'function') return ref(node)
			if (ref) ref.current = node
		},
		[ref],
	)

	const stopEditing = () => {
		setIsStopped(true)
		onCommit?.()
	}
	// Targeted at the field, so it runs before, and stops, any Escape that
	// would close a surrounding dialog or window.
	useHotkey(appHotkeys.stopEditing, stopEditing, {
		enabled: stopEditingOnEscape && !isStopped && !readOnly,
		target: field,
	})
	useHotkey(appHotkeys.resumeEditing, () => setIsStopped(false), {
		enabled: isStopped,
		target: field,
	})

	return (
		<textarea
			{...stylex.props(
				styles.textarea,
				isStopped && styles.stopped,
				xstyle,
			)}
			{...props}
			onBlur={event => {
				onCommit?.()
				onBlur?.(event)
			}}
			onPointerDown={event => {
				setIsStopped(false)
				onPointerDown?.(event)
			}}
			readOnly={readOnly || isStopped}
			ref={setRefs}
		/>
	)
}
