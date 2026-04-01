import { Link } from '@tanstack/react-router'
import { BookOpen, Clock, ListChecks, Search, Settings, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
	HeaderIconButton,
	ReviewModeTooltip
} from '~/app/components/AppHeaderShared'
import { BookOpenOff } from '~/components/icons'
import { SettingsDialog } from '~/components/SettingsDialog'
import { Button } from '~/components/ui/button'
import { SidebarTrigger } from '~/components/ui/sidebar'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/tooltip'
import { SearchDialog } from '~/features/search/components/search-dialog/SearchDialog'
import { cn } from '~/lib/utils'
import { useReviewMode } from '~/stores/ReviewModeContext'

export function AppHeader() {
	const { reviewMode, setReviewMode } = useReviewMode()
	const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
	const [searchOpen, setSearchOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const isReviewModeEnabled = reviewMode === 'on'
	const ReviewModeIcon = isReviewModeEnabled ? BookOpen : BookOpenOff

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
				event.preventDefault()
				setSearchOpen(true)
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [])

	return (
		<>
			<header className='grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 bg-transparent px-2 py-1 sm:px-2 sm:py-1.5'>
				<div className='flex min-w-0 items-center gap-2'>
					<SidebarTrigger className='rounded-full md:hidden' />
				</div>

				<div className='flex min-w-0 justify-center'>
					<div className='flex w-[min(21rem,calc(100vw-6.5rem))] items-center gap-0.5 sm:w-[min(21rem,calc(100vw-8rem))]'>
						<div className='relative min-w-0 flex-1'>
							<Button
								aria-label='Open search'
								className='h-8 w-full justify-start px-2.5 hover:bg-[var(--app-chrome-hover)] active:border-[var(--app-chrome-border)] active:bg-[var(--app-chrome-selected)]'
								onClick={() => setSearchOpen(true)}
								size='sm'
								variant='outline'
							>
								<Search className='h-4 w-4 text-muted-foreground' />
								<span
									className={cn(
										'min-w-0 flex-1 truncate text-left font-normal text-muted-foreground',
										searchQuery && 'text-foreground'
									)}
								>
									{searchQuery || 'Search (⌘K)'}
								</span>
							</Button>
							{searchQuery ? (
								<Button
									aria-label='Clear search'
									className='absolute top-1/2 right-0.5 size-7 -translate-y-1/2 rounded-full p-0 text-muted-foreground hover:bg-[var(--app-chrome-hover)] hover:text-[var(--app-chrome-hover-foreground)] active:border-[var(--app-chrome-border)] active:bg-[var(--app-chrome-selected)] active:text-[var(--app-chrome-selected-foreground)]'
									onClick={event => {
										event.stopPropagation()
										setSearchQuery('')
									}}
									size='sm'
									type='button'
									variant='ghost'
								>
									<X className='h-4 w-4' />
								</Button>
							) : null}
						</div>
						<Tooltip>
							<TooltipTrigger
								render={
									<HeaderIconButton
										ariaLabel={`Review mode ${isReviewModeEnabled ? 'on' : 'off'}`}
										className={cn(
											'size-7.5 px-0',
											isReviewModeEnabled &&
												'border-blue-200 bg-blue-50 text-blue-700 shadow-xs hover:border-blue-300 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-200 dark:hover:bg-blue-900/70'
										)}
										onClick={() =>
											setReviewMode(isReviewModeEnabled ? 'off' : 'on')
										}
										showNativeTitle={false}
										variant='outline'
									/>
								}
							>
								<ReviewModeIcon />
							</TooltipTrigger>
							<TooltipContent>
								<ReviewModeTooltip isEnabled={isReviewModeEnabled} />
							</TooltipContent>
						</Tooltip>
					</div>
				</div>

				<div className='flex min-w-0 items-center justify-end gap-0'>
					<Tooltip>
						<TooltipTrigger
							render={
								<HeaderIconButton
									ariaLabel='Recent'
									className='size-7.5 px-0'
									nativeButton={false}
									render={<Link to='/recent' />}
									showNativeTitle={false}
								/>
							}
						>
							<Clock />
						</TooltipTrigger>
						<TooltipContent>Recent</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger
							render={
								<HeaderIconButton
									ariaLabel='Logbook'
									className='size-7.5 px-0'
									nativeButton={false}
									render={<Link to='/logbook' />}
									showNativeTitle={false}
								/>
							}
						>
							<ListChecks />
						</TooltipTrigger>
						<TooltipContent>Logbook</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger
							render={
								<HeaderIconButton
									ariaLabel='Settings'
									className='size-7.5 px-0'
									onClick={() => setIsSettingsDialogOpen(true)}
									showNativeTitle={false}
								/>
							}
						>
							<Settings />
						</TooltipTrigger>
						<TooltipContent>Settings</TooltipContent>
					</Tooltip>
				</div>
			</header>

			<SearchDialog
				onOpenChange={setSearchOpen}
				open={searchOpen}
				query={searchQuery}
				setQuery={setSearchQuery}
			/>
			<SettingsDialog
				onOpenChange={setIsSettingsDialogOpen}
				open={isSettingsDialogOpen}
			/>
		</>
	)
}
