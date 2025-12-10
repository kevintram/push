import {
	Archive,
	ArchiveRestore,
	Baby,
	ChevronDown,
	GitPullRequestClosed,
	Inbox,
	MoreHorizontal,
	Trash2,
	User2
} from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useCallback } from 'react'
import { TopicDateDisplay } from '~/components/TopicDateDisplay'
import { Button } from '~/components/ui/Button'
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/Card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/Popover'
import { useUpdateTopicReview } from '~/features/reviews/api/updateTopicReview'
import type { Rating } from '~/features/reviews/types/review.types'
import { getRatingIcon } from '~/utils/getRatingIcon'
import { highlightText, truncateWithHighlight } from '~/utils/textHighlight'
import { useDeleteTopic } from '../api/deleteTopic'
import { useUpdateTopic } from '../api/updateTopic'
import type { Topic } from '../types/topic.types'

const MIN_HEIGHT = 96

interface TopicCardProps {
	topic: Topic
	onTopicClick?: (topic: Topic) => void
	onRemoveRelationship?: () => void
	removeRelationshipText?: string
	minHeight?: number
	searchQuery?: string
	rating?: Rating | null
	reviewId?: number
}

export function TopicCard({
	topic,
	onTopicClick,
	onRemoveRelationship,
	removeRelationshipText = 'Remove as Child',
	minHeight = MIN_HEIGHT,
	searchQuery, // for topic card in search dialog to support highlighting and shit
	rating,
	reviewId
}: TopicCardProps) {
	const deleteTopicMutation = useDeleteTopic()
	const updateTopicMutation = useUpdateTopic()
	const updateReviewMutation = useUpdateTopicReview()

	const parentCount = topic.parents?.length ?? 0
	const childCount = topic.children?.length ?? 0

	const handleActivate = useCallback(() => {
		onTopicClick?.(topic)
	}, [onTopicClick, topic])

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault()
				onTopicClick?.(topic)
			}
		},
		[onTopicClick, topic]
	)

	const handleDeleteTopic = () => {
		deleteTopicMutation.mutate(topic.id)
	}

	const handleArchiveToggle = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			await updateTopicMutation.mutateAsync({
				id: topic.id,
				archived: !topic.archived
			})
		},
		[updateTopicMutation, topic.id, topic.archived]
	)

	const handleInboxToggle = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			await updateTopicMutation.mutateAsync({
				id: topic.id,
				inboxed: !topic.inboxed
			})
		},
		[updateTopicMutation, topic.id, topic.inboxed]
	)

	const handleRatingChange = useCallback(
		async (newRating: Rating) => {
			if (!reviewId) return
			await updateReviewMutation.mutateAsync({
				id: reviewId,
				rating: newRating
			})
		},
		[reviewId, updateReviewMutation]
	)

	return (
		<Card
			className='cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
			onClick={handleActivate}
			onKeyDown={handleKeyDown}
			role='button'
			style={{ minHeight: `${minHeight}px` }}
			tabIndex={0}
		>
			<CardHeader className='flex flex-row items-center justify-between'>
				{/* Parents count - top left */}
				<Popover>
					<PopoverTrigger asChild={true}>
						<div
							className='flex cursor-pointer items-center gap-1 text-muted-foreground text-xs hover:text-foreground'
							onClick={e => e.stopPropagation()}
						>
							<User2 className='h-3 w-3' />
							<span>{parentCount}</span>
						</div>
					</PopoverTrigger>
					<PopoverContent
						align='start'
						className='w-64 p-3'
						onClick={e => e.stopPropagation()}
						onKeyDown={e => e.stopPropagation()}
						side='top'
					>
						<div className='flex flex-col gap-2'>
							<h4 className='font-semibold text-sm'>Parent Topics</h4>
							{parentCount === 0 ? (
								<p className='text-muted-foreground text-xs'>No parents</p>
							) : (
								<ul className='flex flex-col gap-1.5'>
									{(topic.parents ?? []).map(parent => (
										<li
											className='break-words text-sm leading-tight '
											key={parent.id}
										>
											{parent.name || parent.notes || 'Untitled'}
										</li>
									))}
								</ul>
							)}
						</div>
					</PopoverContent>
				</Popover>

				{/* Rating and Menu - top right */}
				<div className='flex items-center gap-1'>
					{rating && reviewId && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild={true}>
								<Button
									className='h-5 gap-1 px-1.5 text-xs capitalize'
									onClick={e => e.stopPropagation()}
									size='sm'
									variant='outline'
								>
									{getRatingIcon(rating)}
									{rating}
									<ChevronDown className='h-3 w-3' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='start' side='bottom' sideOffset={2}>
								<DropdownMenuItem
									onClick={e => {
										e.stopPropagation()
										handleRatingChange('miss')
									}}
								>
									{getRatingIcon('miss')}
									<span className='ml-2 capitalize'>Miss</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={e => {
										e.stopPropagation()
										handleRatingChange('hard')
									}}
								>
									{getRatingIcon('hard')}
									<span className='ml-2 capitalize'>Hard</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={e => {
										e.stopPropagation()
										handleRatingChange('good')
									}}
								>
									{getRatingIcon('good')}
									<span className='ml-2 capitalize'>Good</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={e => {
										e.stopPropagation()
										handleRatingChange('easy')
									}}
								>
									{getRatingIcon('easy')}
									<span className='ml-2 capitalize'>Easy</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
					{rating && !reviewId && (
						<Button
							className='h-5 gap-1 px-1.5 text-xs capitalize'
							onClick={e => e.stopPropagation()}
							size='sm'
							variant='outline'
						>
							{getRatingIcon(rating)}
							{rating}
						</Button>
					)}
					<DropdownMenu>
						<DropdownMenuTrigger asChild={true}>
							<Button
								className='h-5 w-5 p-0'
								onClick={e => e.stopPropagation()}
								variant='ghost'
							>
								<MoreHorizontal className='h-3 w-3' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end' side='bottom' sideOffset={2}>
							<DropdownMenuItem onClick={handleInboxToggle}>
								{topic.inboxed ? (
									<>
										<Inbox className='mr-2 h-4 w-4' />
										Remove from Inbox
									</>
								) : (
									<>
										<Inbox className='mr-2 h-4 w-4' />
										Add to Inbox
									</>
								)}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleArchiveToggle}>
								{topic.archived ? (
									<>
										<ArchiveRestore className='mr-2 h-4 w-4' />
										Unarchive
									</>
								) : (
									<>
										<Archive className='mr-2 h-4 w-4' />
										Archive
									</>
								)}
							</DropdownMenuItem>
							{onRemoveRelationship && (
								<DropdownMenuItem
									onClick={e => {
										e.stopPropagation()
										onRemoveRelationship()
									}}
								>
									<GitPullRequestClosed className='mr-2 h-4 w-4' />
									{removeRelationshipText}
								</DropdownMenuItem>
							)}
							<DropdownMenuItem
								onClick={e => {
									e.stopPropagation()
									handleDeleteTopic()
								}}
								variant='destructive'
							>
								<Trash2 className='mr-2 h-4 w-4' />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>

			<CardContent className='flex flex-col gap-3'>
				<div className='flex flex-col gap-1'>
					{/* Inbox/Archive indicators */}
					{(topic.inboxed || topic.archived) && (
						<div className='flex items-center gap-2 text-muted-foreground text-xs'>
							{topic.inboxed && (
								<div className='flex items-center gap-1'>
									<Inbox className='h-3 w-3' />
									<span>Inboxed</span>
								</div>
							)}
							{topic.archived && (
								<div className='flex items-center gap-1'>
									<Archive className='h-3 w-3' />
									<span>Archived</span>
								</div>
							)}
						</div>
					)}

					{/* The Actual Content */}
					<div className='flex flex-col gap-0.5'>
						{topic.name && (
							<h3 className='break-word font-semibold leading-tight [overflow-wrap:anywhere]'>
								{searchQuery
									? highlightText({ text: topic.name, query: searchQuery })
									: topic.name}
							</h3>
						)}
						{topic.notes && (
							<p className='break-word text-sm [overflow-wrap:anywhere]'>
								{searchQuery
									? truncateWithHighlight(topic.notes, searchQuery, 150)
									: topic.notes}
							</p>
						)}
					</div>
				</div>
			</CardContent>

			{/* Bottom row: Review date and children count */}
			<CardFooter className='gap-1 text-muted-foreground text-xs'>
				{/* Due date - bottom left */}
				<TopicDateDisplay
					due={topic.due}
					scheduledAt={topic.scheduled_at}
					srsEnabled={topic.srs_enabled}
				/>
				<div className='flex-1' />
				{/* Children count - bottom right */}
				<Popover>
					<PopoverTrigger asChild={true}>
						<div
							className='flex cursor-pointer items-center gap-1 hover:text-foreground'
							onClick={e => e.stopPropagation()}
						>
							<Baby className='h-3 w-3' />
							<span>{childCount}</span>
						</div>
					</PopoverTrigger>
					<PopoverContent
						align='end'
						className='w-64 p-3'
						onClick={e => e.stopPropagation()}
						onKeyDown={e => e.stopPropagation()}
						side='bottom'
					>
						<div className='flex flex-col gap-2'>
							<h4 className='font-semibold text-sm'>Child Topics</h4>
							{childCount === 0 ? (
								<p className='text-muted-foreground text-xs'>No children</p>
							) : (
								<ul className='flex flex-col gap-1.5'>
									{(topic.children ?? []).map(child => (
										<li
											className='break-words text-sm leading-tight'
											key={child.id}
										>
											{child.name || child.notes || 'Untitled'}
										</li>
									))}
								</ul>
							)}
						</div>
					</PopoverContent>
				</Popover>
			</CardFooter>
		</Card>
	)
}
