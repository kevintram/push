import * as stylex from '@stylexjs/stylex'
import { Loader, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '~/components/ui'
import { colors } from '~/styles/colors.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	spacing,
} from '~/styles/tokens.stylex'

const spin = stylex.keyframes({
	to: {
		transform: 'rotate(360deg)',
	},
})

const styles = stylex.create({
	page: {
		padding: spacing.xl,

		alignItems: 'center',
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		justifyContent: 'center',
		minHeight: '100svh',
	},
	content: {
		gap: spacing.lg,

		alignItems: 'center',
		display: 'flex',
		flexDirection: 'column',
		textAlign: 'center',
	},
	icon: {
		alignItems: 'center',
		animationDuration: '1s',
		animationIterationCount: 'infinite',
		animationName: spin,
		animationTimingFunction: 'linear',
		color: colors.textSecondary,
		display: 'flex',
		justifyContent: 'center',
		height: iconSizes.xl,
		width: iconSizes.xl,
	},
	title: {
		margin: spacing.none,

		fontSize: fontSizes.xl,
		fontWeight: fontWeights.semibold,
		letterSpacing: '-0.02em',
		lineHeight: 1.3,
	},
	buttonIcon: {
		height: iconSizes.md,
		width: iconSizes.md,
	},
})

// Sign-in normally resolves in well under a second. Holding the retry button
// back keeps it out of that flash, so it only appears once the wait has become
// long enough to read as stuck.
const RETRY_VISIBLE_AFTER_MS = 5000

type NotAuthenticatedPageProps = {
	onRetry: () => void
}

export function NotAuthenticatedPage({ onRetry }: NotAuthenticatedPageProps) {
	const [canRetry, setCanRetry] = useState(false)

	useEffect(() => {
		const timeout = setTimeout(
			() => setCanRetry(true),
			RETRY_VISIBLE_AFTER_MS,
		)

		return () => clearTimeout(timeout)
	}, [])

	return (
		<main {...stylex.props(styles.page)}>
			<div {...stylex.props(styles.content)}>
				<section
					aria-labelledby='authentication-loading-title'
					role='status'
					{...stylex.props(styles.content)}
				>
					<Loader aria-hidden='true' {...stylex.props(styles.icon)} />

					<h1
						id='authentication-loading-title'
						{...stylex.props(styles.title)}
					>
						Signing you in
					</h1>
				</section>

				{canRetry && (
					<Button onClick={onRetry} variant='secondary'>
						<RefreshCw
							aria-hidden='true'
							{...stylex.props(styles.buttonIcon)}
						/>
						Retry
					</Button>
				)}
			</div>
		</main>
	)
}
