import { AlertTriangle } from 'lucide-react'
import type { MouseEvent } from 'react'
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'

type RetireReviewCardDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	onConfirm: () => void
	onSeeReviews: () => void
	isPending?: boolean
}

export function RetireReviewCardDialog({
	open,
	onOpenChange,
	onConfirm,
	onSeeReviews,
	isPending = false
}: RetireReviewCardDialogProps) {
	function stopPropagation(event: MouseEvent) {
		event.stopPropagation()
	}

	return (
		<AlertDialog onOpenChange={onOpenChange} open={open}>
			<AlertDialogContent onClick={stopPropagation} size='sm'>
				<AlertDialogHeader>
					<AlertDialogMedia>
						<AlertTriangle className='size-5 text-amber-600' />
					</AlertDialogMedia>
					<AlertDialogTitle>
						This card still has scheduled reviews!
					</AlertDialogTitle>
					<AlertDialogDescription>
						This card will still appear when due.{' '}
						<button
							className='underline hover:text-foreground'
							onClick={event => {
								stopPropagation(event)
								onSeeReviews()
							}}
							type='button'
						>
							See reviews.
						</button>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending} onClick={stopPropagation}>
						Cancel
					</AlertDialogCancel>
					<Button
						disabled={isPending}
						onClick={event => {
							stopPropagation(event)
							event.preventDefault()
							onConfirm()
						}}
					>
						Confirm
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
