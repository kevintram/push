import { Search } from 'lucide-react'
import { useState } from 'react'
import { Input } from '~/components/ui/Input'
import type { Note } from '~/types/notes.types'

function LibrarySidebar(props: {
	notes: Array<Note> | undefined
	onNoteSelected: (note: Note) => void
}) {
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
				{props?.notes?.map(item => (
					<button
						className='flex w-full cursor-pointer items-center justify-between rounded-lg p-3 text-left hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
						key={item.name}
						onClick={() => props.onNoteSelected(item)}
						type='button'
					>
						<div className='min-w-0 flex-1'>
							<div className='truncate font-medium text-sm'>{item.name}</div>
							<div className='truncate text-muted-foreground text-xs'>
								{item.notes}
							</div>
						</div>
					</button>
				))}
			</div>
		</div>
	)
}

export { LibrarySidebar }
