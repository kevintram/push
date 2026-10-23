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
	confirmLabel?: string
	description: string
	isPending: boolean
	onConfirm: () => void
	onOpenChange: (open: boolean) => void
	open: boolean
	title: string
}

export function DeleteConfirmationDialog({
	confirmLabel = 'Delete',
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
					<Button
						variant='danger'
						disabled={isPending}
						onClick={onConfirm}
					>
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
