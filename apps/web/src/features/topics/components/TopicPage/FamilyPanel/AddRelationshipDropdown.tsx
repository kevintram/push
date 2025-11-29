import { Loader2, Plus, Search, SquarePen } from 'lucide-react'
import { useCallback } from 'react'
import { Badge } from '~/components/ui/Badge'
import { Card, CardContent } from '~/components/ui/Card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { cn } from '~/lib/utils'
import type { Topic } from '~/models/review-topic.types'
import { useCreateRelationship } from '../../../hooks/useCreateRelationship'
import { useCreateTopic } from '../../../hooks/useCreateTopic'

interface AddRelationshipDropdownProps {
	topicId: number | undefined
	relationshipType: 'parent' | 'child'
	onOpenSearchDialog: () => void
	variant: 'badge' | 'card'
	className?: string
	onRelationshipCreated?: (topic: Topic) => void
	onTopicOpen?: (topic: Topic) => void
}

export function AddRelationshipDropdown({
	topicId,
	relationshipType,
	onOpenSearchDialog,
	variant,
	className,
	onRelationshipCreated,
	onTopicOpen
}: AddRelationshipDropdownProps) {
	const createTopic = useCreateTopic()
	const createRelationship = useCreateRelationship()
	const { openTopicDialog } = useReviewTopicDialog()

	const isCreating = createTopic.isPending || createRelationship.isPending

	const handleCreateNew = useCallback(async () => {
		if (!topicId) return

		try {
			// Create blank topic
			const newTopic = await createTopic.mutateAsync({
				name: '',
				notes: ''
			})

			// Create relationship based on type
			if (relationshipType === 'child') {
				await createRelationship.mutateAsync({
					parent: topicId,
					child: newTopic.id
				})
			} else {
				await createRelationship.mutateAsync({
					parent: newTopic.id,
					child: topicId
				})
			}

			// Call onRelationshipCreated callback if provided
			onRelationshipCreated?.(newTopic)

			// Open the created topic
			if (onTopicOpen) {
				onTopicOpen(newTopic)
			} else {
				openTopicDialog(newTopic.id)
			}
		} catch (_error) {}
	}, [
		topicId,
		relationshipType,
		createTopic,
		createRelationship,
		onRelationshipCreated,
		openTopicDialog,
		onTopicOpen
	])

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild={true} disabled={isCreating}>
				{variant === 'badge' ? (
					<Badge
						className={cn(
							'cursor-pointer items-center border-dashed py-1 hover:bg-muted/50',
							className
						)}
						variant='outline'
					>
						{isCreating ? (
							<Loader2 className='h-3 w-3 animate-spin' />
						) : (
							<Plus className='h-3 w-3' />
						)}
					</Badge>
				) : (
					<Card
						className={cn(
							'cursor-pointer border-2 border-dashed transition-colors hover:bg-muted/50',
							className
						)}
					>
						<CardContent className='flex items-center justify-center p-3'>
							{isCreating ? (
								<Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
							) : (
								<Plus className='h-4 w-4 text-muted-foreground' />
							)}
						</CardContent>
					</Card>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent align='start' side='right'>
				<DropdownMenuItem onClick={onOpenSearchDialog}>
					<Search className='h-4 w-4' />
					Search
				</DropdownMenuItem>
				<DropdownMenuItem onClick={handleCreateNew}>
					<SquarePen className='h-4 w-4' />
					Create New
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
