import { api } from '@convex/_generated/api'
import { convexQuery } from '@convex-dev/react-query'
import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@workos-inc/authkit-react'
import { useConvexAuth } from 'convex/react'
import { UserRound } from 'lucide-react'

import { Button } from '~/components/ui'
import { colors } from '~/styles/colors.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

const styles = stylex.create({
	section: {
		width: '100%',
	},
	heading: {
		marginBlockEnd: spacing.lg,
		marginBlockStart: spacing.none,

		fontSize: fontSizes.sm,
		fontWeight: fontWeights.semibold,
		letterSpacing: '-0.01em',
		lineHeight: 1.4,
	},
	accountRow: {
		gap: spacing.lg,
		paddingBlock: spacing.xl,

		alignItems: 'center',
		borderBlockEndColor: colors.borderSecondary,
		borderBlockEndStyle: 'solid',
		borderBlockEndWidth: '1px',
		borderBlockStartColor: colors.borderSecondary,
		borderBlockStartStyle: 'solid',
		borderBlockStartWidth: '1px',
		display: 'grid',
		gridTemplateColumns: {
			default: '40px minmax(0, 1fr) auto',
			'@media (max-width: 560px)': '40px minmax(0, 1fr)',
		},
		width: '100%',
	},
	avatar: {
		borderColor: colors.borderSecondary,
		borderRadius: radii.full,
		borderStyle: 'solid',
		borderWidth: '1px',

		alignItems: 'center',
		backgroundColor: colors.bgSurface,
		color: colors.textSecondary,
		display: 'flex',
		justifyContent: 'center',
		height: '40px',
		width: '40px',
	},
	accountCopy: {
		gap: spacing.xs,
		display: 'grid',
		minWidth: 0,
	},
	accountName: {
		margin: spacing.none,
		overflow: 'hidden',

		fontSize: fontSizes.md,
		fontWeight: fontWeights.medium,
		lineHeight: 1.35,
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	accountDescription: {
		margin: spacing.none,

		color: colors.textSecondary,
		fontSize: fontSizes.sm,
		lineHeight: 1.45,
	},
	status: {
		gap: spacing.sm,
		alignItems: 'center',
		display: 'flex',
	},
	statusDot: {
		borderRadius: radii.full,
		flexShrink: 0,
		height: '6px',
		width: '6px',
	},
	statusDotIdle: {
		backgroundColor: colors.textSecondary,
	},
	statusDotLoading: {
		backgroundColor: colors.bgFillInfo,
	},
	statusDotConnected: {
		backgroundColor: colors.bgFillSuccess,
	},
	actionContainer: {
		gridColumnEnd: {
			default: 'auto',
			'@media (max-width: 560px)': '-1',
		},
		gridColumnStart: {
			default: 'auto',
			'@media (max-width: 560px)': '1',
		},
		justifySelf: {
			default: 'end',
			'@media (max-width: 560px)': 'start',
		},
		marginBlockStart: {
			default: spacing.none,
			'@media (max-width: 560px)': spacing.sm,
		},
	},
})

export function AccountSettingsSection() {
	const { isLoading: isAuthLoading, signIn, signOut, user } = useAuth()
	const { isAuthenticated, isLoading, isRefreshing } = useConvexAuth()
	// Not suspense: this read is gated on auth state rather than a route
	// loader, so it has to be able to sit in a disabled state.
	const { data: identity } = useQuery(
		convexQuery(api.auth.verifyIdentity, isAuthenticated ? {} : 'skip'),
	)

	const identityVerified = identity?.authenticated === true
	const sessionLoading = isAuthLoading || isLoading || isRefreshing
	const displayName =
		[user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
		user?.email ||
		'Your account'

	const status = sessionLoading
		? 'Checking your session'
		: identityVerified
			? 'Connected'
			: isAuthenticated
				? 'Connecting'
				: 'Signed out'

	const description = user?.email
		? user.email
		: 'Sign in to sync your library and review history.'

	const statusStyle = sessionLoading
		? styles.statusDotLoading
		: identityVerified
			? styles.statusDotConnected
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
		<section
			aria-labelledby='account-settings-heading'
			{...stylex.props(styles.section)}
		>
			<h2 id='account-settings-heading' {...stylex.props(styles.heading)}>
				Account
			</h2>

			<div {...stylex.props(styles.accountRow)}>
				<div aria-hidden='true' {...stylex.props(styles.avatar)}>
					<UserRound size={iconSizes.lg} strokeWidth={1.75} />
				</div>

				<div {...stylex.props(styles.accountCopy)}>
					<p {...stylex.props(styles.accountName)}>{displayName}</p>
					<p {...stylex.props(styles.accountDescription)}>
						{description}
					</p>
					<div role='status' {...stylex.props(styles.status)}>
						<span
							aria-hidden='true'
							{...stylex.props(styles.statusDot, statusStyle)}
						/>
						<span {...stylex.props(styles.accountDescription)}>
							{status}
						</span>
					</div>
				</div>

				<div {...stylex.props(styles.actionContainer)}>
					<Button
						disabled={sessionLoading}
						onClick={handleAuthAction}
						size='small'
						variant={isAuthenticated ? 'outline' : 'primary'}
					>
						{isAuthenticated ? 'Sign out' : 'Sign in'}
					</Button>
				</div>
			</div>
		</section>
	)
}
