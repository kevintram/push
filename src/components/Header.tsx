import { Search } from 'lucide-react'
import { Input } from '~/components/ui/Input'

export function Header() {
	return (
		<header className='border-b bg-background px-6 py-2'>
			<div className='flex justify-center gap-2'>
				<div className='relative'>
					<Search className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
					<Input
						className='w-128 pl-10'
						placeholder='Search'
						type='search'
					/>
				</div>
			</div>
		</header>
	)
}
