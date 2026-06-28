import { type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'

import { useSidebar } from '~/components/ui/sidebar'
import { cn } from '~/lib/utils'
import { AppHeader } from '~/modules/shell/header/AppHeader'
import { AppSidebar } from '~/modules/shell/sidebar/AppSidebar'

export function AppShellContent({
	children,
	onSidebarResizeStart,
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
						'transition-[margin] duration-200 ease-linear',
					)}
				>
					{children}
				</div>
			</div>
		</>
	)
}
