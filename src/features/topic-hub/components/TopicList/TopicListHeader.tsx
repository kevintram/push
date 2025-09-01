import { Plus, Search } from 'lucide-react'
import { Button } from '~/components/ui/Button'
import { Input } from '~/components/ui/Input'

interface TopicListHeaderProps {
	onCreateTopic: () => void
}

export function TopicListHeader({ onCreateTopic }: TopicListHeaderProps) {
	return (
		<div className='flex items-center gap-2'>
			<div className='relative flex-1'>
				<Search className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
				<Input className='pl-9' placeholder='Search topics...' />
			</div>
			<Button onClick={onCreateTopic} size='icon' variant='secondary'>
				<Plus className='h-4 w-4' />
			</Button>
		</div>
	)
}
