import * as stylex from '@stylexjs/stylex'
import { Loader } from 'lucide-react'
import { useEffect, useState } from 'react'

import { notAuthenticatedPageColors } from '~/styles/colors/components.stylex'
import {
	fontSizes,
	fontWeights,
	graphicSizes,
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
		color: notAuthenticatedPageColors.loadingIndicatorForeground,
		display: 'flex',
		justifyContent: 'center',
		height: graphicSizes.md,
		width: graphicSizes.md,
	},
	title: {
		margin: spacing.none,

		fontSize: fontSizes.xl,
		fontWeight: fontWeights.semibold,
		letterSpacing: '-0.02em',
		lineHeight: 1.3,
	},
})

type NotAuthenticatedPageProps = {
	delayMs?: number
}

export function NotAuthenticatedPage({
	delayMs = 0,
}: NotAuthenticatedPageProps) {
	const [isVisible, setIsVisible] = useState(delayMs <= 0)

	useEffect(() => {
		if (delayMs <= 0) return

		const timeout = setTimeout(() => setIsVisible(true), delayMs)

		return () => clearTimeout(timeout)
	}, [delayMs])

	if (!isVisible) return null

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
			</div>
		</main>
	)
}
