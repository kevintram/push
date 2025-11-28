import { MoreHorizontal, Trash } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'

interface ReviewDetailHeaderProps {
	onDelete: () => void
	headerActions?: ReactNode
}

export function ReviewDetailHeader({
	onDelete,
	headerActions
}: ReviewDetailHeaderProps) {
	return (
		<div className='flex items-center justify-end gap-4 px-2 py-1'>
			<div className='flex items-center gap-2'>
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
						<DropdownMenuItem onClick={onDelete} variant='destructive'>
							<Trash className='mr-2 h-4 w-4' />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				{headerActions}
			</div>
		</div>
	)
}
