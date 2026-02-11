import { useState } from 'react'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import {
	type ChildHandlingStrategy,
	useDeleteTopic
} from '~/features/topics/api/deleteTopic'
import type { Topic } from '~/features/topics/types/topic.types'

interface DeleteTopicDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	topic: Topic
	onSuccess?: () => void
}

export function DeleteTopicDialog({
	open,
	onOpenChange,
	topic,
	onSuccess
}: DeleteTopicDialogProps) {
	const [strategy, setStrategy] = useState<ChildHandlingStrategy>('delete')
	const deleteTopicMutation = useDeleteTopic()

	const childrenCount = topic.children_count ?? 0
	const hasParent = topic.parent_id !== null

	const handleDelete = () => {
		deleteTopicMutation.mutate(
			{ topicId: topic.id, handleChildrenBy: strategy },
			{
				onSuccess: () => {
					onOpenChange(false)
					onSuccess?.()
				}
			}
		)
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Topic</DialogTitle>
					<DialogDescription>
						What do you want to do with the topic's {childrenCount}{' '}
						{childrenCount === 1 ? 'child' : 'children'}?
					</DialogDescription>
				</DialogHeader>

				<div className='flex flex-col gap-3'>
					<Label className='cursor-pointer'>
						<input
							checked={strategy === 'delete'}
							className='accent-primary'
							name='strategy'
							onChange={() => setStrategy('delete')}
							type='radio'
							value='delete'
						/>
						Delete them
					</Label>

					<Label className='cursor-pointer'>
						<input
							checked={strategy === 'orphan'}
							className='accent-primary'
							name='strategy'
							onChange={() => setStrategy('orphan')}
							type='radio'
							value='orphan'
						/>
						Make them root topics
					</Label>

					{hasParent && (
						<Label className='cursor-pointer'>
							<input
								checked={strategy === 'reparent'}
								className='accent-primary'
								name='strategy'
								onChange={() => setStrategy('reparent')}
								type='radio'
								value='reparent'
							/>
							Move them to grandparent
						</Label>
					)}
				</div>

				<DialogFooter>
					<Button onClick={() => onOpenChange(false)} variant='outline'>
						Cancel
					</Button>
					<Button
						disabled={deleteTopicMutation.isPending}
						onClick={handleDelete}
						variant='destructive'
					>
						{deleteTopicMutation.isPending ? 'Deleting...' : 'Delete'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
