import * as stylex from '@stylexjs/stylex'
import type { FallbackProps } from 'react-error-boundary'

import { Button } from '~/components/ui'
import { colors } from '~/styles/colors.stylex'
import { fontSizes, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		gap: spacing.md,
		alignItems: 'center',
		display: 'flex',
		flexBasis: 0,
		flexDirection: 'column',
		flexGrow: 1,
		flexShrink: 1,
		justifyContent: 'center',

		fontSize: fontSizes.sm,
	},
	message: { color: colors.textSecondary },
})

/**
 * Keeps a failed card fetch inside the overlay. Without a local boundary the
 * throw from `useSuspenseQuery` reaches the root boundary and replaces the
 * whole page behind the open dialog.
 */
export function FocusOverlayCardError({
	error,
	resetErrorBoundary,
}: FallbackProps) {
	return (
		<div {...stylex.props(styles.container)} role='alert'>
			<p>Could not load this review card.</p>
			<p {...stylex.props(styles.message)}>
				{error instanceof Error ? error.message : String(error)}
			</p>
			<Button
				variant='secondary'
				size='small'
				onClick={resetErrorBoundary}
			>
				Try again
			</Button>
		</div>
	)
}
