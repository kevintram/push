import type {
	CSSProperties,
	ReactNode,
	PointerEvent as ReactPointerEvent
} from 'react'
import { useEffect, useState } from 'react'
import { SidebarProvider, useSidebar } from '~/components/ui/sidebar'
import { cn } from '~/lib/utils'
import { AppHeader } from '~/modules/shell/header/AppHeader'
import { AppSidebar } from '~/modules/shell/sidebar/AppSidebar'
import {
	APP_SIDEBAR_WIDTH_STORAGE_KEY,
	clampAppSidebarWidth,
	getStoredAppSidebarWidth
} from '~/modules/shell/sidebar/appSidebarWidth'

export function AppShell({ children }: { children: ReactNode }) {
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
			className='h-svh bg-[var(--app-shell)]'
			style={
				{
					'--sidebar-width': `${sidebarWidth}px`
				} as CSSProperties
			}
		>
			<AppShellContent onSidebarResizeStart={handleSidebarResizeStart}>
				{children}
			</AppShellContent>
		</SidebarProvider>
	)
}

/**
 * Another component so we can use context hook `useSidebar`
 */
function AppShellContent({
	children,
	onSidebarResizeStart
}: {
	children: ReactNode
	onSidebarResizeStart: (event: ReactPointerEvent<HTMLDivElement>) => void
}) {
	const { state } = useSidebar()

	return (
		<>
			<AppSidebar onResizeStart={onSidebarResizeStart} />
			<div className='flex flex-1 flex-col'>
				<AppHeader />
				<div
					className={cn(
						'min-h-0 min-w-0 flex-1 overflow-y-auto',
						'border border-[var(--workspace-border)] bg-[var(--workspace-surface)] shadow-[var(--workspace-shadow)]',
						'md:m-2 md:rounded-[1.15rem]',
						state === 'expanded' && 'md:ml-0', // when expanded, remove left margin!
						'transition-[margin] duration-200 ease-linear'
					)}
				>
					{children}
				</div>
			</div>
		</>
	)
}
