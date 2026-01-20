import { useState } from 'react'
import { Button } from '~/components/ui/Button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/Dialog'
import { Label } from '~/components/ui/Label'
import {
	type ChildHandlingStrategy,
	useDeleteSource
} from '~/features/sources/api/deleteSource'
import type { Source } from '~/features/sources/types/source.types'

interface DeleteSourceDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	source: Source
	onSuccess?: () => void
}

export function DeleteSourceDialog({
	open,
	onOpenChange,
	source,
	onSuccess
}: DeleteSourceDialogProps) {
	const [strategy, setStrategy] = useState<ChildHandlingStrategy>('delete')
	const deleteSourceMutation = useDeleteSource()

	const childrenCount = source.children_count ?? 0
	const hasParent = source.parent_id !== null

	const handleDelete = () => {
		deleteSourceMutation.mutate(
			{ sourceId: source.id, handleChildrenBy: strategy },
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
					<DialogTitle>Delete Source</DialogTitle>
					<DialogDescription>
						What do you want to do with the source's {childrenCount}{' '}
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
						Make them root sources
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
						disabled={deleteSourceMutation.isPending}
						onClick={handleDelete}
						variant='destructive'
					>
						{deleteSourceMutation.isPending ? 'Deleting...' : 'Delete'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
