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
import { useCreateRelationship } from '../../../hooks/useCreateRelationship'

interface AddRelationshipDropdownProps {
	topicId: number | undefined
	relationshipType: 'parent' | 'child'
	onOpenSearchDialog: () => void
	variant: 'badge' | 'card'
	className?: string
	onTopicOpen?: (topicId: number) => void
}

export function AddRelationshipDropdown({
	topicId,
	relationshipType,
	onOpenSearchDialog,
	variant,
	className,
	onTopicOpen
}: AddRelationshipDropdownProps) {
	const createRelationship = useCreateRelationship()
	const { openTopicDialog } = useReviewTopicDialog()

	const isCreating = createRelationship.isPending

	const handleCreateNew = useCallback(async () => {
		if (!topicId) return

		try {
			const newTopicData = {
				name: '',
				notes: '',
				archived: false,
				inboxed: false
			}

			// Use inline creation - create topic and relationship in one call
			const response = await createRelationship.mutateAsync(
				relationshipType === 'child'
					? { parent: topicId, childData: newTopicData }
					: { child: topicId, parentData: newTopicData }
			)

			// Get the newly created topic ID (child or parent depending on relationship type)
			const newTopicId =
				relationshipType === 'child' ? response.child.id : response.parent.id

			// Open the created topic
			if (onTopicOpen) {
				onTopicOpen(newTopicId)
			} else {
				openTopicDialog(newTopicId)
			}
		} catch (_error) {}
	}, [
		topicId,
		relationshipType,
		createRelationship,
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
