import {
	Archive,
	ArchiveX,
	Check,
	Inbox,
	MoreHorizontal,
	Plus,
	Trash
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import type { Topic } from '~/models/review-topic.types'
import { TopicParentsPanel } from '../TopicPage/FamilyPanel/TopicParentsPanel'

interface TopicDetailHeaderProps {
	topic: Topic
	onArchiveToggle: () => void
	onInboxToggle: () => void
	onDelete: () => void
	onParentSelect?: (parent: Topic) => void
	headerActions?: ReactNode
	isAddedToReview?: boolean
	onAddToReview?: () => void
	onRemoveFromReview?: () => void
	onTopicCreated?: (topic: Topic) => void
	renderReviewToggle?: ReactNode
}

export function TopicDetailHeader({
	topic,
	onArchiveToggle,
	onInboxToggle,
	onDelete,
	onParentSelect,
	headerActions,
	isAddedToReview,
	onAddToReview,
	onRemoveFromReview,
	onTopicCreated,
	renderReviewToggle
}: TopicDetailHeaderProps) {
	return (
		<div className='sticky top-0 z-10 w-full border-b'>
			<div className='flex items-center justify-between gap-4 px-2 py-1'>
				<div className='flex min-w-0 flex-1 items-center gap-4'>
					<TopicParentsPanel
						onParentSelect={onParentSelect}
						onTopicCreated={onTopicCreated}
					/>
				</div>

				<div className='flex items-center gap-2'>
					{renderReviewToggle
						? renderReviewToggle
						: onAddToReview &&
							onRemoveFromReview && (
								<Button
									className={`!p-2 h-6 gap-1 rounded-lg ${isAddedToReview ? 'text-green-400' : ''}`}
									onClick={isAddedToReview ? onRemoveFromReview : onAddToReview}
									variant='secondary'
								>
									{isAddedToReview ? (
										<>
											<Check className='h-4 w-4' />
											Added
										</>
									) : (
										<>
											<Plus className='h-4 w-4' />
											Add
										</>
									)}
								</Button>
							)}
					<DropdownMenu>
						<DropdownMenuTrigger asChild={true}>
							<Button
								className='h-6 w-6 p-0'
								size='sm'
								title='More options'
								variant='ghost'
							>
								<MoreHorizontal className='h-4 w-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem onClick={onArchiveToggle}>
								{topic.archived ? (
									<>
										<ArchiveX className='mr-2 h-4 w-4' />
										Unarchive
									</>
								) : (
									<>
										<Archive className='mr-2 h-4 w-4' />
										Archive
									</>
								)}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={onInboxToggle}>
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
							<DropdownMenuItem onClick={onDelete} variant='destructive'>
								<Trash className='mr-2 h-4 w-4' />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{headerActions}
				</div>
			</div>
		</div>
	)
}
