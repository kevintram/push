import {
	type CSSProperties,
	type PointerEvent as ReactPointerEvent,
	type ReactNode,
} from 'react'
import { useEffect, useState } from 'react'

import { SidebarProvider } from '~/components/ui/sidebar'
import {
	APP_SIDEBAR_WIDTH_STORAGE_KEY,
	clampAppSidebarWidth,
	getStoredAppSidebarWidth,
} from '~/modules/shell/sidebar/appSidebarWidth'

import { AppShellContent } from './AppShellContent'

export function AppShell({ children }: { children: ReactNode }) {
	const [sidebarWidth, setSidebarWidth] = useState(getStoredAppSidebarWidth)
	const [isResizingSidebar, setIsResizingSidebar] = useState(false)

	useEffect(() => {
		if (typeof window === 'undefined') return
		if (typeof window.localStorage?.setItem !== 'function') return

		window.localStorage.setItem(
			APP_SIDEBAR_WIDTH_STORAGE_KEY,
			sidebarWidth.toString(),
		)
	}, [sidebarWidth])

	useEffect(() => {
		if (typeof document === 'undefined') return
		if (!isResizingSidebar) return

		document.body.classList.add('cursor-col-resize', 'select-none')

		return () => {
			document.body.classList.remove('cursor-col-resize', 'select-none')
		}
	}, [isResizingSidebar])

	const handleSidebarResizeStart = (
		event: ReactPointerEvent<HTMLDivElement>,
	) => {
		event.preventDefault()

		const startX = event.clientX
		const startWidth = sidebarWidth

		setIsResizingSidebar(true)

		const handlePointerMove = (moveEvent: PointerEvent) => {
			const nextWidth = clampAppSidebarWidth(
				startWidth + (moveEvent.clientX - startX),
			)
			setSidebarWidth(nextWidth)
		}

		const handlePointerUp = () => {
			setIsResizingSidebar(false)
			window.removeEventListener('pointermove', handlePointerMove)
			window.removeEventListener('pointerup', handlePointerUp)
		}

		window.addEventListener('pointermove', handlePointerMove)
		window.addEventListener('pointerup', handlePointerUp)
	}

	return (
		<SidebarProvider
			className='h-svh bg-[var(--app-shell)]'
			style={
				{
					'--sidebar-width': `${sidebarWidth}px`,
				} as CSSProperties
			}
		>
			<AppShellContent onSidebarResizeStart={handleSidebarResizeStart}>
				{children}
			</AppShellContent>
		</SidebarProvider>
	)
}
