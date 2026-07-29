import * as stylex from '@stylexjs/stylex'
import { useAuth } from '@workos-inc/authkit-react'
import { useConvexAuth, useQuery } from 'convex/react'

import { Button } from '~/components/ui'
import { colors } from '~/styles/colors.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'

import { api } from '../../../convex/_generated/api'

const styles = stylex.create({
	panel: {
		insetBlockEnd: spacing.lg,
		insetInlineEnd: spacing.lg,
		position: 'fixed',
		zIndex: 100,

		padding: spacing.lg,
		gap: spacing.md,
		display: 'flex',
		flexDirection: 'column',
		inlineSize: 'min(280px, calc(100vw - 32px))',

		borderColor: colors.borderSecondary,
		borderRadius: radii.xl,
		borderStyle: 'solid',
		borderWidth: '1px',
		backgroundColor: colors.bgSurface,
		boxShadow: `0 12px 32px ${colors.shadowStrong}`,
		color: colors.text,
	},
	header: {
		gap: spacing.xs,
		display: 'flex',
		flexDirection: 'column',
	},
	eyebrow: {
		color: colors.textSecondary,
		fontSize: fontSizes.xs,
		fontWeight: fontWeights.semibold,
		letterSpacing: '0.08em',
		lineHeight: 1.25,
		textTransform: 'uppercase',
	},
	title: {
		margin: spacing.none,
		fontSize: fontSizes.md,
		fontWeight: fontWeights.semibold,
		lineHeight: 1.25,
	},
	status: {
		gap: spacing.sm,
		alignItems: 'center',
		color: colors.textSecondary,
		display: 'flex',
		fontSize: fontSizes.sm,
		lineHeight: 1.4,
		minBlockSize: '20px',
	},
	statusDot: {
		borderRadius: radii.full,
		blockSize: '8px',
		flexShrink: 0,
		inlineSize: '8px',
	},
	statusDotIdle: {
		backgroundColor: colors.bgFillWarning,
	},
	statusDotLoading: {
		backgroundColor: colors.bgFillInfo,
	},
	statusDotSuccess: {
		backgroundColor: colors.bgFillSuccess,
	},
})

export function AuthConnectionProbe() {
	const { signIn, signOut } = useAuth()
	const { isAuthenticated, isLoading, isRefreshing } = useConvexAuth()
	const identity = useQuery(
		api.auth.getIdentity,
		isAuthenticated ? {} : 'skip',
	)

	const identityVerified = identity?.authenticated === true
	const status = isLoading
		? 'Checking session'
		: !isAuthenticated
			? 'Not signed in'
			: isRefreshing
				? 'Refreshing session'
				: identityVerified
					? 'Verified by Convex'
					: 'Verifying with Convex'

	const statusStyle =
		isLoading || (isAuthenticated && !identityVerified)
			? styles.statusDotLoading
			: identityVerified
				? styles.statusDotSuccess
				: styles.statusDotIdle

	const handleAuthAction = () => {
		const action = isAuthenticated ? signOut : signIn

		void Promise.resolve(action()).catch(() => {
			console.error(
				isAuthenticated
					? 'Unable to sign out of WorkOS'
					: 'Unable to start WorkOS sign-in',
			)
		})
	}

	return (
		<aside
			aria-label='Convex authentication probe'
			{...stylex.props(styles.panel)}
		>
			<div {...stylex.props(styles.header)}>
				<span {...stylex.props(styles.eyebrow)}>Development only</span>
				<h2 {...stylex.props(styles.title)}>Convex authentication</h2>
			</div>

			<div role='status' {...stylex.props(styles.status)}>
				<span
					aria-hidden='true'
					{...stylex.props(styles.statusDot, statusStyle)}
				/>
				<span>{status}</span>
			</div>

			<Button
				disabled={isLoading}
				onClick={handleAuthAction}
				size='small'
				variant={isAuthenticated ? 'outline' : 'primary'}
			>
				{isAuthenticated ? 'Sign out' : 'Sign in'}
			</Button>
		</aside>
	)
}
