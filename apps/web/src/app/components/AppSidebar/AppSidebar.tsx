import { Link, useNavigate } from '@tanstack/react-router'
import { Library, Minimize2, Plus } from 'lucide-react'
import {
	type PointerEvent as ReactPointerEvent,
	useCallback,
	useRef
} from 'react'

import { AppSidebarTopicTree } from '~/app/components/AppSidebar/AppSidebarTopicTree'
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar
} from '~/components/ui/sidebar'

export function AppSidebar({
	onResizeStart
}: {
	onResizeStart?: (event: ReactPointerEvent<HTMLDivElement>) => void
}) {
	const navigate = useNavigate()
	const { isMobile, state } = useSidebar()
	const collapseAllRef = useRef<(() => void) | null>(null)

	const handleCollapseAllReady = useCallback((collapseAll: () => void) => {
		collapseAllRef.current = collapseAll
	}, [])

	const handleCollapseAll = () => {
		collapseAllRef.current?.()
	}

	const handleAddTopic = () => {
		navigate({ to: '/topics', search: { create: true } })
	}

	return (
		<Sidebar
			className='!border-r-0 z-20 bg-[var(--app-shell)]'
			collapsible='offcanvas'
		>
			<SidebarContent className='gap-1 overflow-hidden bg-[var(--app-shell)]'>
				<div className='flex shrink-0 flex-col gap-1'>
					<SidebarGroup className='px-1.5 pt-1 pb-0'>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton
										render={<Link to='/topics' />}
										tooltip='Topics'
									>
										<Library />
										<span>Topics</span>
									</SidebarMenuButton>
									<div className='absolute top-1.5 right-1 z-10 flex items-center gap-0.5'>
										<SidebarMenuAction
											aria-label='Collapse all topics'
											className='static'
											onClick={event => {
												event.preventDefault()
												event.stopPropagation()
												handleCollapseAll()
											}}
											type='button'
										>
											<Minimize2 className='h-4 w-4' />
											<span className='sr-only'>Collapse all topics</span>
										</SidebarMenuAction>
										<SidebarMenuAction
											aria-label='Add topic'
											className='static'
											onClick={event => {
												event.preventDefault()
												event.stopPropagation()
												handleAddTopic()
											}}
											type='button'
										>
											<Plus className='h-4 w-4' />
											<span className='sr-only'>Add topic</span>
										</SidebarMenuAction>
									</div>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</div>

				<AppSidebarTopicTree onCollapseAllReady={handleCollapseAllReady} />
			</SidebarContent>

			{!isMobile && state === 'expanded' && onResizeStart ? (
				<div
					aria-hidden='true'
					className='group absolute top-0 right-0 z-20 hidden h-full w-3 translate-x-1/2 cursor-col-resize items-center justify-center md:flex'
					onPointerDown={onResizeStart}
				>
					<div className='h-16 w-px rounded-full bg-transparent transition-colors group-hover:bg-border/55' />
				</div>
			) : null}
		</Sidebar>
	)
}
