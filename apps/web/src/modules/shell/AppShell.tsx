import { Outlet } from '@tanstack/react-router'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { useEffect, useState } from 'react'
import {
	SidebarInset,
	SidebarProvider,
	useSidebar
} from '~/components/ui/sidebar'
import { cn } from '~/lib/utils'
import { AppHeader } from '~/modules/shell/header/AppHeader'
import { AppSidebar } from '~/modules/shell/sidebar/AppSidebar'
import {
	APP_SIDEBAR_WIDTH_STORAGE_KEY,
	clampAppSidebarWidth,
	getStoredAppSidebarWidth
} from '~/modules/shell/sidebar/appSidebarWidth'

export function AppShell() {
	const [sidebarWidth, setSidebarWidth] = useState(getStoredAppSidebarWidth)
	const [isResizingSidebar, setIsResizingSidebar] = useState(false)

	useEffect(() => {
		if (typeof window === 'undefined') return
		if (typeof window.localStorage?.setItem !== 'function') return

		window.localStorage.setItem(
			APP_SIDEBAR_WIDTH_STORAGE_KEY,
			sidebarWidth.toString()
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
		event: ReactPointerEvent<HTMLDivElement>
	) => {
		event.preventDefault()

		const startX = event.clientX
		const startWidth = sidebarWidth

		setIsResizingSidebar(true)

		const handlePointerMove = (moveEvent: PointerEvent) => {
			const nextWidth = clampAppSidebarWidth(
				startWidth + (moveEvent.clientX - startX)
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
			className='bg-[var(--app-shell)]'
			style={
				{
					'--sidebar-width': `${sidebarWidth}px`
				} as CSSProperties
			}
		>
			<AppShellContent onSidebarResizeStart={handleSidebarResizeStart} />
		</SidebarProvider>
	)
}

function AppShellContent({
	onSidebarResizeStart
}: {
	onSidebarResizeStart: (event: ReactPointerEvent<HTMLDivElement>) => void
}) {
	const { isMobile, state } = useSidebar()
	const shouldInsetLeft = !isMobile && state === 'collapsed'

	return (
		<>
			<AppSidebar onResizeStart={onSidebarResizeStart} />
			<SidebarInset className='!bg-[var(--app-shell)] h-svh'>
				<div className='relative flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--app-shell)]'>
					<AppHeader />
					<div
						className={cn(
							'relative min-h-0 min-w-0 flex-1 px-0 pb-0 transition-[padding] duration-200 ease-linear md:pr-2 md:pb-2',
							shouldInsetLeft && 'md:pl-2'
						)}
					>
						<div
							className='relative flex h-full min-h-0 min-w-0 flex-1 overflow-hidden border border-[var(--workspace-border)] bg-[var(--workspace-surface)] md:rounded-[1.15rem]'
							style={{ boxShadow: 'var(--workspace-shadow)' }}
						>
							<Outlet />
						</div>
					</div>
				</div>
			</SidebarInset>
		</>
	)
}
