import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'

import { useHideMode } from '~/modules/reviews/hide-mode/useHideMode'
import { appShellColors } from '~/styles/colors/components.stylex'
import { slate } from '~/styles/colors/primitives.stylex'
import { breakpoints, layout, radii } from '~/styles/tokens.stylex'

import { CollapsedAppSidebar } from './CollapsedAppSidebar'
import { ExpandedAppSidebar } from './ExpandedAppSidebar'

const SIDEBAR_STORAGE_KEY = 'appSidebarExpanded'
const SIDEBAR_ID = 'app-sidebar'

function readSidebarExpandedPreference() {
	try {
		return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
	} catch {
		return false
	}
}

const hideModeOnChromeTheme = stylex.createTheme(appShellColors, {
	chromeBackground: {
		default: slate.s700,
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
		// Establish the desktop inset used by sidebar and page toolbar alignment.
		marginBlock: {
			default: 0,
			[breakpoints.tablet]: layout.appShellInset,
		},
		flexGrow: 1,
		marginInlineEnd: {
			default: 0,
			[breakpoints.tablet]: layout.appShellInset,
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
	const [isSidebarExpanded, setIsSidebarExpanded] = useState(
		readSidebarExpandedPreference,
	)
	const collapsedToggleRef = useRef<HTMLButtonElement>(null)
	const expandedToggleRef = useRef<HTMLButtonElement>(null)
	const pendingFocusTarget = useRef<'expanded' | 'collapsed' | null>(null)

	const toggleSidebar = useCallback(() => {
		const nextExpanded = !isSidebarExpanded
		pendingFocusTarget.current = nextExpanded ? 'expanded' : 'collapsed'
		setIsSidebarExpanded(nextExpanded)
		try {
			window.localStorage.setItem(
				SIDEBAR_STORAGE_KEY,
				String(nextExpanded),
			)
		} catch {
			// The in-memory toggle remains usable when browser storage is unavailable.
		}
	}, [isSidebarExpanded])

	useLayoutEffect(() => {
		if (pendingFocusTarget.current === 'expanded') {
			expandedToggleRef.current?.focus()
		} else if (pendingFocusTarget.current === 'collapsed') {
			collapsedToggleRef.current?.focus()
		}
		pendingFocusTarget.current = null
	}, [isSidebarExpanded])

	return (
		<div
			data-hide-mode={isHideMode ? 'on' : 'off'}
			{...stylex.props(styles.shell, isHideMode && hideModeOnChromeTheme)}
		>
			{isSidebarExpanded ? (
				<ExpandedAppSidebar
					hideMode={isHideMode}
					id={SIDEBAR_ID}
					expanded={isSidebarExpanded}
					onToggle={toggleSidebar}
					toggleRef={expandedToggleRef}
				/>
			) : (
				<CollapsedAppSidebar
					hideMode={isHideMode}
					id={SIDEBAR_ID}
					expanded={isSidebarExpanded}
					onToggle={toggleSidebar}
					toggleRef={collapsedToggleRef}
				/>
			)}
			<main {...stylex.props(styles.children)}>{children}</main>
		</div>
	)
}
