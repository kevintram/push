import * as stylex from '@stylexjs/stylex'

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui'

const styles = stylex.create({
	header: {
		flexDirection: 'column',
	},
})

type DeleteConfirmationDialogProps = {
	description: string
	isPending: boolean
	onConfirm: () => void
	onOpenChange: (open: boolean) => void
	open: boolean
	title: string
}

export function DeleteConfirmationDialog({
	description,
	isPending,
	onConfirm,
	onOpenChange,
	open,
	title,
}: DeleteConfirmationDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false}>
				<DialogHeader xstyle={styles.header}>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						disabled={isPending}
						variant='outline'
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button danger disabled={isPending} onClick={onConfirm}>
						Delete
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
