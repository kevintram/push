import * as stylex from '@stylexjs/stylex'
import type { FallbackProps } from 'react-error-boundary'

import { Button } from '~/components/ui'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
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
	message: { color: colorsSemantic.textSecondary },
})

/**
 * Keeps a failed card fetch inside the card-detail surface. Without a local
 * boundary the throw from `useSuspenseQuery` reaches the root boundary and
 * replaces the surrounding page.
 */
export function CardDetailErrorFallback({
	error,
	resetErrorBoundary,
}: FallbackProps) {
	return (
		<div {...stylex.props(styles.container)} role='alert'>
			<p>Could not load this card.</p>
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
