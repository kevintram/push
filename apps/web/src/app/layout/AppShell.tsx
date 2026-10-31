import * as stylex from '@stylexjs/stylex'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCallback, useLayoutEffect, useRef } from 'react'

import { ResizeHandle } from '~/components/ResizeHandle'
import { usePersistedBoolean } from '~/hooks/usePersistedBoolean'
import { useResizableWidth } from '~/hooks/useResizableWidth'
import { collectionQueries } from '~/modules/collections/api/collectionQueries'
import { ReviewNavigationHotkeys } from '~/modules/reviews/components/review-navigation/ReviewNavigationHotkeys'
import { useHideMode } from '~/modules/reviews/hide-mode/useHideMode'
import { appHotkeys } from '~/modules/shortcuts/appHotkeys'
import { ShortcutReferenceDialog } from '~/modules/shortcuts/components/ShortcutReferenceDialog'
import { slate } from '~/styles/colors/colorsPrimitive.stylex'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { breakpoints, layout, radii } from '~/styles/tokens.stylex'

import { CollapsedAppSidebar } from './CollapsedAppSidebar'
import { ExpandedAppSidebar } from './ExpandedAppSidebar'
import { hideModeSidebarTheme } from './hideModeSidebarTheme'

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
	// Positions the resize handle and leaves overflow visible so it can sit
	// over the page edge; the shell clips at the viewport.
	sidebar: {
		color: colorsSemantic.textPrimary,
		flexShrink: 0,
		position: 'relative',
	},
	// Starts the handle half an inset before the page, so it covers only the
	// collection scrollbar's empty end and not its thumb.
	resizeHandle: {
		insetInlineStart: `calc(100% + ${layout.appShellInset} / 2)`,
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
	// Lives here rather than in the expanded sidebar so its handle stays
	// mounted while a drag collapses or opens the sidebar.
	const { width, handleProps } = useResizableWidth({
		storageKey: 'appSidebarWidth',
		// Matches `appSidebar.width`, which the collapsed rail's popover uses.
		defaultWidth: 240,
		minWidth: 220,
		maxWidth: 640,
		edge: 'end',
		// Sets the state directly: unlike the toggle buttons, a drag leaves
		// focus where it is.
		collapse: {
			isCollapsed: !isSidebarExpanded,
			onCollapsedChange: isCollapsed => setSidebarExpanded(!isCollapsed),
		},
	})
	const collapsedToggleRef = useRef<HTMLButtonElement>(null)
	const expandedToggleRef = useRef<HTMLButtonElement>(null)
	const pendingFocusTarget = useRef<'expanded' | 'collapsed' | null>(null)

	const toggleSidebar = useCallback(() => {
		const nextExpanded = !isSidebarExpanded
		pendingFocusTarget.current = nextExpanded ? 'expanded' : 'collapsed'
		setSidebarExpanded(nextExpanded)
	}, [isSidebarExpanded, setSidebarExpanded])

	// The hotkey leaves focus where it is, unless focus is on the toggle that
	// is about to unmount.
	useHotkey(appHotkeys.toggleSidebar, () => {
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
	})

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
						width={width}
					/>
				) : (
					<CollapsedAppSidebar
						navId={SIDEBAR_ID}
						onToggle={toggleSidebar}
						toggleRef={collapsedToggleRef}
					/>
				)}
				<ResizeHandle {...handleProps} xstyle={styles.resizeHandle} />
			</nav>
			<main {...stylex.props(styles.children)}>{children}</main>
			<ReviewNavigationHotkeys />
			<ShortcutReferenceDialog />
		</div>
	)
}
