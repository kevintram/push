import { Plus } from 'lucide-react'
import { Badge } from './ui/Badge'

function TopicHeader(props: { title: string, tags: Array<string>}) {
	return (
		<div className='flex w-full flex-col gap-2'>
			<div className='flex w-full items-center justify-between'>
				<h1 className='font-bold text-3xl'>{props.title}</h1>
			</div>
			<div className='flex w-full items-center gap-2'>
				{props.tags.map(item => (
					<Badge key={item} variant='secondary'>
						{item}
					</Badge>
				))}
				<Badge variant='outline'>
					<Plus className='h-3 w-3' />
				</Badge>
			</div>
		</div>
	)
}

export { TopicHeader }
