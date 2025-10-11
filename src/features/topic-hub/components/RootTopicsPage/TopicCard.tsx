import { useDeleteMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent } from '~/components/ui/Card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'

interface TopicCardProps {
	topic: Tables<'topics'>
	onClick?: () => void
	minHeight: number
}

export function TopicCard({ topic, onClick, minHeight }: TopicCardProps) {
	const { mutateAsync: deleteTopicMutation } = useDeleteMutation(
		supabase.from('topics'),
		['id']
	)

	const handleDeleteTopic = (e: React.MouseEvent) => {
		e.stopPropagation()
		deleteTopicMutation({ id: topic.id })
	}

	return (
		<Card className='group cursor-pointer p-0 transition-colors hover:bg-muted/50'>
			<CardContent
				className='flex h-full flex-col justify-between px-3 py-2'
				onClick={onClick}
				style={{ minHeight: `${minHeight}px` }}
			>
				<div>
					{topic.name && (
						<h3 className='mb-1 font-semibold text-md'>{topic.name}</h3>
					)}
					<div className='line-clamp-5 text-sm'>{topic.notes}</div>
				</div>
				<div className='flex justify-start gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
					<DropdownMenu>
						<DropdownMenuTrigger asChild={true}>
							<Button
								className='h-6 w-6 p-0'
								onClick={e => e.stopPropagation()}
								variant='ghost'
							>
								<MoreHorizontal className='h-3 w-3' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='center' side='bottom' sideOffset={2}>
							<DropdownMenuItem
								className='text-red-600 focus:text-red-600'
								onClick={handleDeleteTopic}
								variant='destructive'
							>
								<Trash2 className='mr-2 h-4 w-4' />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardContent>
		</Card>
	)
}
