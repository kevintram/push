import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Input } from '~/components/ui/Input'
import { SearchDialog } from './SearchDialog'

export function Header() {
	const [searchOpen, setSearchOpen] = useState(false)

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
			<header className='border-b bg-background px-6 py-2'>
				<div className='flex justify-center gap-2'>
					<div className='relative'>
						<Search className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
						<Input
							className='w-128 cursor-pointer pl-10'
							onClick={() => setSearchOpen(true)}
							onFocus={() => setSearchOpen(true)}
							placeholder='Search (⌘K)'
							readOnly={true}
							type='search'
						/>
					</div>
				</div>
			</header>

			<SearchDialog onOpenChange={setSearchOpen} open={searchOpen} />
		</>
	)
}
