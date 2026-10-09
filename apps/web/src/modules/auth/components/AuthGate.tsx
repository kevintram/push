import { SignInButton } from '@clerk/react'
import * as stylex from '@stylexjs/stylex'
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react'
import { LogIn } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '~/components/ui'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	spacing,
} from '~/styles/tokens.stylex'

import { NotAuthenticatedPage } from './NotAuthenticatedPage'

type AuthGateProps = {
	children: ReactNode
}

const AUTH_PENDING_VISIBLE_AFTER_MS = 500

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
	},
	title: {
		margin: spacing.none,

		fontSize: fontSizes.xl,
		fontWeight: fontWeights.semibold,
		letterSpacing: '-0.02em',
		lineHeight: 1.3,
	},
})

/** Holds routed UI until Convex has accepted the Clerk session. */
export function AuthGate({ children }: AuthGateProps) {
	return (
		<>
			<AuthLoading>
				<NotAuthenticatedPage delayMs={AUTH_PENDING_VISIBLE_AFTER_MS} />
			</AuthLoading>

			<Unauthenticated>
				<main {...stylex.props(styles.page)}>
					<section
						aria-labelledby='sign-in-title'
						{...stylex.props(styles.content)}
					>
						<h1 id='sign-in-title' {...stylex.props(styles.title)}>
							Sign in to 3gulp
						</h1>
						<SignInButton mode='modal'>
							<Button>
								<LogIn aria-hidden='true' size={iconSizes.sm} />
								Sign in
							</Button>
						</SignInButton>
					</section>
				</main>
			</Unauthenticated>

			<Authenticated>{children}</Authenticated>
		</>
	)
}
