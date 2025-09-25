import { Link } from '@tanstack/react-router'
import { formatDistanceToNow } from 'date-fns'
import { ExternalLink, SquareLibrary } from 'lucide-react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent, CardFooter } from '~/components/ui/Card'
import type { Tables } from '~/types/database.types'
import { useMoveFromInbox } from '../api'

export function InboxItem({ topic }: { topic: Tables<'topics'> }) {
	const createdAt = new Date(topic.inserted_at)
	const { mutateAsync: moveFromInbox } = useMoveFromInbox()

	return (
		<Card className='transition-all hover:shadow-md'>
			<CardContent className='p-4'>
				<div className='space-y-2'>
					<div className='flex items-start justify-between gap-4'>
						<div className='min-w-0 flex-1'>
							<h3 className='font-semibold text-lg leading-tight'>
								{topic.name}
							</h3>
							{topic.notes && (
								<p className='mt-1 line-clamp-2 text-muted-foreground text-sm'>
									{topic.notes}
								</p>
							)}
						</div>
						<Link
							className='flex-shrink-0'
							params={{ topicId: topic.id.toString() }}
							to='/topics/{-$topicId}'
						>
							<Button size='sm' variant='ghost'>
								<ExternalLink className='h-4 w-4' />
							</Button>
						</Link>
					</div>
					<p className='text-muted-foreground text-xs'>
						Created {formatDistanceToNow(createdAt)} ago
					</p>
				</div>
			</CardContent>
			<CardFooter className='p-4 pt-0'>
				<div className='flex w-full justify-end'>
					<Button
						onClick={() =>
							moveFromInbox({
								id: topic.id,
								is_inboxed: false
							})
						}
						size='sm'
						variant='outline'
					>
						<SquareLibrary className='mr-2 h-4 w-4' />
						Move to Library
					</Button>
				</div>
			</CardFooter>
		</Card>
	)
}
