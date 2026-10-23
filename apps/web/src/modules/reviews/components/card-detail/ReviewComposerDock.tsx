import * as stylex from '@stylexjs/stylex'
import { useId, useState } from 'react'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
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
		display: {
			default: 'none',
			'@container (min-width: 640px)': 'flex',
		},
		flexDirection: 'column',
		inlineSize: `min(540px, calc(100% - 2 * ${spacing.lg}))`,

		borderColor: colorsSemantic.borderSubtle,
		borderRadius: radii.xl,
		borderStyle: 'solid',
		borderWidth: 1,
		backgroundColor: colorsSemantic.surfaceRaised,
		boxShadow: `0 12px 32px ${colorsSemantic.shadowStrong}`,
		color: colorsSemantic.textPrimary,
	},
	minimized: {
		borderColor: colorsSemantic.borderOnInverse,
		backgroundColor: colorsSemantic.surfaceInverse,
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
	const { dockState, isDirty, resetDraft, setDockState } =
		useReviewComposerState()
	const [isDiscardOpen, setIsDiscardOpen] = useState(false)
	const titleId = useId()

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

	if (dockState === 'closed') return null

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

	if (dockState === 'expanded') {
		return (
			<ReviewComposerDialog
				onCollapse={() => setDockState('open')}
				onClose={requestClose}
				onMinimize={() => setDockState('minimized')}
				onSuccess={close}
			>
				{discardDialog}
			</ReviewComposerDialog>
		)
	}

	const isMinimized = dockState === 'minimized'

	return (
		<section
			aria-labelledby={titleId}
			{...stylex.props(styles.window, isMinimized && styles.minimized)}
		>
			{isMinimized ? (
				<ReviewComposerWindowHeader
					onClose={requestClose}
					onTitleClick={() => setDockState('open')}
					titleId={titleId}
				/>
			) : (
				<>
					<ReviewComposerWindowHeader
						onClose={requestClose}
						onMinimize={() => setDockState('minimized')}
						onToggleExpanded={() => setDockState('expanded')}
						titleId={titleId}
					/>
					<div {...stylex.props(styles.body)}>
						<ReviewComposer
							autoFocusDescription
							onSuccess={close}
						/>
					</div>
				</>
			)}
			{discardDialog}
		</section>
	)
}
