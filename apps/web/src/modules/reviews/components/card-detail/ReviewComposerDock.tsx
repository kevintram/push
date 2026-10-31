import * as stylex from '@stylexjs/stylex'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useId, useLayoutEffect, useRef, useState } from 'react'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import { appHotkeys } from '~/modules/shortcuts/appHotkeys'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { radii, spacing } from '~/styles/tokens.stylex'

import { ReviewComposer } from '../ReviewComposer'
import { useReviewComposerState } from '../reviewComposerContext'
import { ReviewComposerDialog } from '../ReviewComposerDialog'
import { ReviewComposerWindowHeader } from '../ReviewComposerWindowHeader'

const styles = stylex.create({
	// Positioned against CardDetail rather than the viewport, so it docks to
	// the card in both the card page and the review queue.
	window: {
		insetBlockEnd: spacing.lg,
		insetInlineEnd: spacing.lg,
		position: 'absolute',
		zIndex: 2,

		padding: spacing.xs,
		gap: spacing.xs,
		blockSize: `min(540px, calc(100% - 2 * ${spacing.lg}))`,
		display: 'flex',
		flexDirection: 'column',
		inlineSize: `min(600px, calc(100% - 2 * ${spacing.lg}))`,

		borderColor: colorsSemantic.borderSubtle,
		borderRadius: radii.xl,
		borderStyle: 'solid',
		borderWidth: 1,
		backgroundColor: colorsSemantic.surfaceRaised,
		boxShadow: `0 12px 32px ${colorsSemantic.shadowStrong}`,
		color: colorsSemantic.textPrimary,
		// Focusable only so a click on its frame keeps focus inside it.
		outlineStyle: 'none',
	},
	minimized: {
		borderColor: colorsSemantic.borderOnInverse,
		// Keyed to the title button, which restores the window, so hovering
		// the close control doesn't light up the whole window.
		backgroundColor: {
			default: colorsSemantic.surfaceInteractiveInverse,
			':has(> header > button:active)':
				colorsSemantic.surfaceInteractiveInverseActive,
			':has(> header > button:hover)':
				colorsSemantic.surfaceInteractiveInverseHover,
		},
		blockSize: 'auto',
		color: colorsSemantic.textOnInverse,
		inlineSize: `min(320px, calc(100% - 2 * ${spacing.lg}))`,
		paddingInlineStart: spacing.sm,
	},
	body: {
		padding: spacing.sm,
		borderRadius: radii.md,
		backgroundColor: colorsSemantic.surfacePrimary,
		flexBasis: 0,
		flexGrow: 1,
		minBlockSize: 0,
	},
})

export function ReviewComposerDock() {
	const { dock, isDirty, resetDraft, setDockState, setExpanded } =
		useReviewComposerState()
	const [isDiscardOpen, setIsDiscardOpen] = useState(false)
	const titleId = useId()
	const windowRef = useRef<HTMLElement>(null)
	const titleButtonRef = useRef<HTMLButtonElement>(null)
	const isMinimizing = useRef(false)

	// The focused control unmounts as the window minimizes, so focus moves to
	// the title button that restores it.
	const minimize = () => {
		isMinimizing.current = true
		setDockState('minimized')
	}

	useLayoutEffect(() => {
		if (!isMinimizing.current || dock.state !== 'minimized') return
		isMinimizing.current = false
		titleButtonRef.current?.focus()
	})

	// Escape fires in the composer's text fields too.
	useHotkey(appHotkeys.minimizeComposer, minimize, {
		enabled: dock.state === 'open' && !dock.isExpanded,
		target: windowRef,
	})

	const close = () => setDockState('closed')
	const requestClose = () => {
		if (isDirty) setIsDiscardOpen(true)
		else close()
	}
	const discard = () => {
		resetDraft()
		setIsDiscardOpen(false)
		close()
	}

	if (dock.state === 'closed') return null

	const discardDialog = (
		<DeleteConfirmationDialog
			confirmLabel='Discard'
			description='This review hasn’t been created yet.'
			isPending={false}
			onConfirm={discard}
			onOpenChange={setIsDiscardOpen}
			open={isDiscardOpen}
			title='Discard review?'
		/>
	)

	if (dock.state === 'open' && dock.isExpanded) {
		return (
			<ReviewComposerDialog
				onCollapse={() => setExpanded(false)}
				onClose={requestClose}
				onMinimize={minimize}
			>
				{discardDialog}
			</ReviewComposerDialog>
		)
	}

	const isMinimized = dock.state === 'minimized'

	return (
		<section
			aria-labelledby={titleId}
			ref={windowRef}
			// A click on the frame or blank space focuses the window rather
			// than the page, so the composer's keys still reach it.
			tabIndex={-1}
			{...stylex.props(styles.window, isMinimized && styles.minimized)}
		>
			{isMinimized ? (
				<ReviewComposerWindowHeader
					onClose={requestClose}
					onTitleClick={() => setDockState('open')}
					titleButtonRef={titleButtonRef}
					titleId={titleId}
				/>
			) : (
				<>
					<ReviewComposerWindowHeader
						onClose={requestClose}
						onMinimize={minimize}
						minimizeHotkey={appHotkeys.minimizeComposer}
						onToggleExpanded={() => setExpanded(true)}
						titleId={titleId}
					/>
					<div {...stylex.props(styles.body)}>
						<ReviewComposer
							autoFocus='rating'
							hotkeyTarget={windowRef}
						/>
					</div>
				</>
			)}
			{discardDialog}
		</section>
	)
}
