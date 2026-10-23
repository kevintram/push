import * as stylex from '@stylexjs/stylex'
import { type ReactNode, useId } from 'react'

import { Dialog, DialogContent } from '~/components/ui'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { radii, spacing } from '~/styles/tokens.stylex'

import { ReviewComposer } from './ReviewComposer'
import { ReviewComposerWindowHeader } from './ReviewComposerWindowHeader'

const styles = stylex.create({
	popup: {
		padding: spacing.sm,
		gap: spacing.sm,
		backgroundColor: colorsSemantic.surfaceRaised,
		blockSize: '88dvh',
		display: 'flex',
		flexDirection: 'column',
		maxInlineSize: '900px',
	},
	body: {
		padding: spacing.md,
		borderRadius: radii.md,
		backgroundColor: colorsSemantic.surfacePrimary,
		flexBasis: 0,
		flexGrow: 1,
		minBlockSize: 0,
	},
})

type ReviewComposerDialogProps = {
	/** Returns to the docked window. Escape and outside clicks also collapse. */
	onCollapse: () => void
	onClose: () => void
	onMinimize: () => void
	onSuccess: () => void
	/** Dialogs that must stack above this one, such as a discard prompt. */
	children?: ReactNode
}

export function ReviewComposerDialog({
	onCollapse,
	onClose,
	onMinimize,
	onSuccess,
	children,
}: ReviewComposerDialogProps) {
	const titleId = useId()

	return (
		<Dialog
			open
			onOpenChange={nextOpen => {
				if (!nextOpen) onCollapse()
			}}
		>
			<DialogContent
				aria-labelledby={titleId}
				showCloseButton={false}
				xstyle={styles.popup}
			>
				<ReviewComposerWindowHeader
					isExpanded
					onClose={onClose}
					onMinimize={onMinimize}
					onToggleExpanded={onCollapse}
					titleId={titleId}
				/>
				<div {...stylex.props(styles.body)}>
					<ReviewComposer
						autoFocusDescription
						onSuccess={onSuccess}
					/>
				</div>
				{children}
			</DialogContent>
		</Dialog>
	)
}
