import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui'
import { spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	header: {
		gap: spacing.lg,
		flexDirection: 'column',
	},
	title: {
		overflowWrap: 'anywhere',
	},
	description: {
		display: 'flex',
		flexDirection: 'column',
		lineHeight: '20px',
	},
})

type DeleteConfirmationDialogProps = {
	confirmLabel?: string
	description: ReactNode
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
					<DialogTitle xstyle={styles.title}>{title}</DialogTitle>
					<DialogDescription
						render={<div />}
						xstyle={styles.description}
					>
						<p>{description}</p>
						<p>
							<strong>You can't undo this action.</strong>
						</p>
					</DialogDescription>
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
