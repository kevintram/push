import { useHotkeys } from '@tanstack/react-hotkeys'
import { type RefObject, useLayoutEffect, useRef } from 'react'

import { appHotkeys } from '~/modules/shortcuts/appHotkeys'

import type { CardTab } from './CardDetail'

type CardDetailHotkeysProps = {
	activeTab: CardTab
	tabRefs: Record<CardTab, RefObject<HTMLElement | null>>
	isSidebarOpen: boolean
	onToggleSidebar: () => void
	sidebarRef: RefObject<HTMLElement | null>
	sidebarToggleRef: RefObject<HTMLElement | null>
}

/**
 * The card's keys for its tabs and details sidebar. Neither moves focus,
 * unless focus was on something the change removes; then it lands on the
 * control that brings it back, rather than dropping to the page.
 */
export function CardDetailHotkeys({
	activeTab,
	tabRefs,
	isSidebarOpen,
	onToggleSidebar,
	sidebarRef,
	sidebarToggleRef,
}: CardDetailHotkeysProps) {
	// What had focus when a key switched tabs. On the card page the tabs are
	// links, so the switch lands on a later render.
	const pendingSwitch = useRef<{
		tab: CardTab
		focus: Element | null
	} | null>(null)

	useLayoutEffect(() => {
		const pending = pendingSwitch.current
		if (pending?.tab !== activeTab) return
		pendingSwitch.current = null
		if (pending.focus && !pending.focus.isConnected) {
			tabRefs[activeTab].current?.focus()
		}
	})

	// Clicking the tab takes the same path as the mouse, whether the tab is a
	// router link or local state.
	const showTab = (tab: CardTab) => {
		if (tab === activeTab) return
		pendingSwitch.current = { tab, focus: document.activeElement }
		tabRefs[tab].current?.click()
	}

	const toggleSidebar = () => {
		const hadFocus =
			isSidebarOpen &&
			sidebarRef.current?.contains(document.activeElement)
		onToggleSidebar()
		if (hadFocus) sidebarToggleRef.current?.focus()
	}

	useHotkeys([
		{
			hotkey: appHotkeys.showOverview,
			callback: () => showTab('overview'),
		},
		{
			hotkey: appHotkeys.showReviews,
			callback: () => showTab('reviews'),
		},
		{
			hotkey: appHotkeys.toggleDetails,
			callback: toggleSidebar,
		},
	])

	return null
}
