import * as stylex from '@stylexjs/stylex'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCallback, useLayoutEffect, useRef } from 'react'

import { usePersistedBoolean } from '~/hooks/usePersistedBoolean'
import { collectionQueries } from '~/modules/collections/api/collectionQueries'
import { useHideMode } from '~/modules/reviews/hide-mode/useHideMode'
import { slate } from '~/styles/colors/colorsPrimitive.stylex'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { breakpoints, layout, radii } from '~/styles/tokens.stylex'

import { CollapsedAppSidebar } from './CollapsedAppSidebar'
import { ExpandedAppSidebar } from './ExpandedAppSidebar'
import { hideModeSidebarTheme } from './hideModeSidebarTheme'
import { SIDEBAR_HOTKEY } from './sidebarHotkey'

const SIDEBAR_STORAGE_KEY = 'appSidebarExpanded'
const SIDEBAR_ID = 'app-sidebar'

const styles = stylex.create({
	shell: {
		overflow: 'hidden',

		display: 'flex',

		height: '100svh',

		backgroundColor: colorsSemantic.surfaceSunken,
	},
	hideModeShell: {
		backgroundColor: {
			default: slate.s700,
			'@media (prefers-color-scheme: dark)': slate.s900,
		},
	},
	// Leaves overflow visible so the expanded sidebar's resize handle can sit
	// over the page edge; the shell clips at the viewport.
	sidebar: {
		color: colorsSemantic.textPrimary,
		flexShrink: 0,
	},
	children: {
		// Establish the inset used by sidebar and page toolbar alignment.
		marginBlock: layout.appShellInset,
		flexGrow: 1,
		marginInlineEnd: layout.appShellInset,
		minHeight: 0,
		minWidth: 0,

		position: 'relative',
		zIndex: 1,
		overflowY: 'auto',

		borderRadius: radii.xl,
		backgroundColor: colorsSemantic.surfacePrimary,
		boxShadow: {
			default: 'none',
			[breakpoints.desktop]: `0 0 4px ${colorsSemantic.shadowPrimary}`,
		},
	},
})

type AppShellProps = {
	children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
	const { hideMode } = useHideMode()
	// Keeps the collection list subscribed while the sidebar is collapsed, so
	// expanding it renders the tree from cache instead of an empty one.
	// The shell never reads the data, so it opts out of re-rendering on it.
	useQuery({ ...collectionQueries.list(), notifyOnChangeProps: [] })
	const isHideMode = hideMode === 'on'
	const [isSidebarExpanded, setSidebarExpanded] = usePersistedBoolean(
		SIDEBAR_STORAGE_KEY,
		false,
	)
	const collapsedToggleRef = useRef<HTMLButtonElement>(null)
	const expandedToggleRef = useRef<HTMLButtonElement>(null)
	const pendingFocusTarget = useRef<'expanded' | 'collapsed' | null>(null)

	const toggleSidebar = useCallback(() => {
		const nextExpanded = !isSidebarExpanded
		pendingFocusTarget.current = nextExpanded ? 'expanded' : 'collapsed'
		setSidebarExpanded(nextExpanded)
	}, [isSidebarExpanded, setSidebarExpanded])

	// The hotkey leaves focus where it is, unless focus is on the toggle that
	// is about to unmount. Skip auto-repeat instead of using `requireReset`:
	// macOS sends no keyup for B while Cmd is held, so a reset would swallow
	// the next press until Cmd is released.
	useHotkey(
		SIDEBAR_HOTKEY,
		event => {
			if (event.repeat) {
				return
			}
			const { activeElement } = document
			const isToggleFocused =
				activeElement !== null &&
				(activeElement === collapsedToggleRef.current ||
					activeElement === expandedToggleRef.current)
			if (isToggleFocused) {
				toggleSidebar()
			} else {
				setSidebarExpanded(!isSidebarExpanded)
			}
		},
		{ preventDefault: true },
	)

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
			{...stylex.props(styles.shell, isHideMode && styles.hideModeShell)}
		>
			<nav
				id={SIDEBAR_ID}
				aria-label='primary'
				{...stylex.props(
					styles.sidebar,
					isHideMode && hideModeSidebarTheme,
				)}
			>
				{isSidebarExpanded ? (
					<ExpandedAppSidebar
						navId={SIDEBAR_ID}
						onToggle={toggleSidebar}
						toggleRef={expandedToggleRef}
					/>
				) : (
					<CollapsedAppSidebar
						navId={SIDEBAR_ID}
						onToggle={toggleSidebar}
						toggleRef={collapsedToggleRef}
					/>
				)}
			</nav>
			<main {...stylex.props(styles.children)}>{children}</main>
		</div>
	)
}
