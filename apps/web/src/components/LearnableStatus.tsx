import { Archive, ArchiveX, Inbox, X } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/popover'

interface LearnableStatusProps {
	archived: boolean
	inboxed: boolean
	onArchiveToggle: () => void
	onInboxToggle: () => void
}

export function LearnableStatus({
	archived,
	inboxed,
	onArchiveToggle,
	onInboxToggle
}: LearnableStatusProps) {
	if (!(archived || inboxed)) {
		return null
	}

	return (
		<div className='-translate-x-2 flex flex-row'>
			{archived && (
				<Popover>
					<PopoverTrigger
						render={
							<Button className='flex items-center' size='sm' variant='ghost'>
								<Archive className='h-4 w-4 text-muted-foreground' />
								<span className='text-muted-foreground text-xs'>Archived</span>
							</Button>
						}
					/>
					<PopoverContent className='w-auto p-2'>
						<Button
							className='w-full justify-start'
							onClick={onArchiveToggle}
							size='sm'
							variant='ghost'
						>
							<ArchiveX className='mr-2 h-4 w-4' />
							Unarchive
						</Button>
					</PopoverContent>
				</Popover>
			)}
			{inboxed && (
				<Popover>
					<PopoverTrigger
						render={
							<Button className='flex items-center' size='sm' variant='ghost'>
								<Inbox className='h-4 w-4 text-muted-foreground' />
								<span className='text-muted-foreground text-xs'>Inboxed</span>
							</Button>
						}
					/>
					<PopoverContent className='w-auto p-2'>
						<Button
							className='w-full justify-start'
							onClick={onInboxToggle}
							size='sm'
							variant='ghost'
						>
							<X className='mr-2 h-4 w-4' />
							Remove from inbox
						</Button>
					</PopoverContent>
				</Popover>
			)}
		</div>
	)
}
