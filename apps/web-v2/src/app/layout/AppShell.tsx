import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { useHideMode } from '~/modules/reviews/hide-mode/useHideMode'
import { appShellColors } from '~/styles/colors/components.stylex'
import { slate } from '~/styles/colors/primitives.stylex'
import { breakpoints, radii } from '~/styles/tokens.stylex'

import { AppSidebar } from './AppSidebar'

const hideModeOnChromeTheme = stylex.createTheme(appShellColors, {
	chromeBackground: {
		default: 'oklch(49% 0.044 257.3)',
		'@media (prefers-color-scheme: dark)': slate.s900,
	},
})

const styles = stylex.create({
	shell: {
		overflow: 'hidden',
		overscrollBehaviorY: 'none',

		display: 'flex',

		height: '100svh',

		backgroundColor: appShellColors.chromeBackground,
	},
	children: {
		marginBlock: {
			default: 0,
			[breakpoints.tablet]: 6,
		},
		flexGrow: 1,
		marginInlineEnd: {
			default: 0,
			[breakpoints.tablet]: 6,
		},
		minHeight: 0,
		minWidth: 0,

		position: 'relative',
		zIndex: 1,
		overflowY: 'auto',

		borderRadius: {
			default: 0,
			[breakpoints.tablet]: radii.xl,
		},
		backgroundColor: appShellColors.surfaceBackground,
		boxShadow: {
			default: 'none',
			[breakpoints.desktop]: `0 0 4px ${appShellColors.surfaceShadow}`,
		},
	},
})

type AppShellProps = {
	children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
	const { hideMode } = useHideMode()
	const isHideMode = hideMode === 'on'

	return (
		<div
			data-hide-mode={isHideMode ? 'on' : 'off'}
			{...stylex.props(styles.shell, isHideMode && hideModeOnChromeTheme)}
		>
			<AppSidebar hideMode={isHideMode} />
			<main {...stylex.props(styles.children)}>{children}</main>
		</div>
	)
}
