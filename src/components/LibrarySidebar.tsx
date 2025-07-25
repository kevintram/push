import { Search } from 'lucide-react'
import { useState } from 'react'
import type { Note } from '~/types/note'
import { Input } from './ui/Input'

function LibrarySidebar(props: { notes: Array<Note> }) {
	const [searchValue, setSearchValue] = useState('')

	return (
		<div className='flex w-60 flex-none flex-col gap-4 bg-background p-4'>
			<div className='flex w-full items-center gap-2'>
				<div className='relative flex-1'>
					<Search className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
					<Input
						className='pl-9'
						onChange={e => setSearchValue(e.target.value)}
						placeholder='Search'
						value={searchValue}
					/>
				</div>
			</div>

			<div className='flex w-full flex-col gap-2 overflow-auto'>
				{props.notes.map(item => (
					<div
						className='flex cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-muted/50'
						key={item.title}
					>
						<div className='min-w-0 flex-1'>
							<div className='truncate font-medium text-sm'>{item.title}</div>
							<div className='truncate text-muted-foreground text-xs'>
								{item.content}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

export { LibrarySidebar }
