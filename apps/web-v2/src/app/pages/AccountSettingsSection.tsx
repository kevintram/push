import { useClerk, useUser } from '@clerk/react'
import * as stylex from '@stylexjs/stylex'
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
	const { signOut } = useClerk()
	const { user } = useUser()
	const displayName = user?.fullName?.trim()
	const email = user?.primaryEmailAddress?.emailAddress

	const handleSignOut = () => {
		void signOut({ redirectUrl: '/' }).catch(() => {
			console.error('Unable to sign out of Clerk')
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
					{displayName && (
						<p {...stylex.props(styles.accountName)}>
							{displayName}
						</p>
					)}
					<p {...stylex.props(styles.accountDescription)}>{email}</p>
				</div>

				<div {...stylex.props(styles.actionContainer)}>
					<Button
						onClick={handleSignOut}
						size='small'
						variant='outline'
					>
						Sign out
					</Button>
				</div>
			</div>
		</section>
	)
}
