import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Input } from '~/components/ui/Input'
import { SearchDialog } from '~/features/search/components/SearchDialog'
import { SidebarTrigger } from './ui/Sidebar'

export function Header() {
	const [searchOpen, setSearchOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault()
				setSearchOpen(true)
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [])

	return (
		<>
			<header
				className='relative top-0 w-full items-center px-2 py-0'
				style={{
					height: 'var(--app-header-height)',
					minHeight: 'var(--app-header-height)'
				}}
			>
				<SidebarTrigger className='-translate-y-1/2 absolute top-1/2' />
				<div className='-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2'>
					<Search className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
					<Input
						className='w-128 cursor-pointer pr-10 pl-10'
						onChange={e => setSearchQuery(e.target.value)}
						onClick={() => setSearchOpen(true)}
						onFocus={() => setSearchOpen(true)}
						placeholder='Search (⌘K)'
						type='text'
						value={searchQuery}
					/>
					{searchQuery && (
						<button
							className='-translate-y-1/2 absolute top-1/2 right-3 h-4 w-4 text-muted-foreground transition-colors hover:text-foreground'
							onClick={e => {
								e.stopPropagation()
								setSearchQuery('')
							}}
							type='button'
						>
							<X className='h-4 w-4' />
						</button>
					)}
				</div>
			</header>

			<SearchDialog
				onOpenChange={setSearchOpen}
				open={searchOpen}
				query={searchQuery}
				setQuery={setSearchQuery}
			/>
		</>
	)
}
