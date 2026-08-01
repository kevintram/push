import * as stylex from '@stylexjs/stylex'
import { CircleAlert, RefreshCw } from 'lucide-react'

import { Button } from '~/components/ui'
import { colors } from '~/styles/colors.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	spacing,
} from '~/styles/tokens.stylex'

const styles = stylex.create({
	page: {
		padding: spacing.xl,

		alignItems: 'center',
		display: 'flex',
		justifyContent: 'center',
		minHeight: '100svh',
	},
	content: {
		gap: spacing.lg,

		alignItems: 'center',
		display: 'flex',
		flexDirection: 'column',
		textAlign: 'center',
		maxWidth: '420px',
	},
	icon: {
		color: colors.textDanger,
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

type AuthFailedPageProps = {
	onRetry: () => void
}

export function AuthFailedPage({ onRetry }: AuthFailedPageProps) {
	return (
		<main {...stylex.props(styles.page)}>
			<section
				aria-labelledby='sign-in-failed-title'
				{...stylex.props(styles.content)}
			>
				<CircleAlert
					aria-hidden='true'
					strokeWidth={1.75}
					{...stylex.props(styles.icon)}
				/>

				<h1 id='sign-in-failed-title' {...stylex.props(styles.title)}>
					Sign in failed
				</h1>

				<Button onClick={onRetry} variant='secondary'>
					<RefreshCw
						aria-hidden='true'
						{...stylex.props(styles.buttonIcon)}
					/>
					Retry
				</Button>
			</section>
		</main>
	)
}
