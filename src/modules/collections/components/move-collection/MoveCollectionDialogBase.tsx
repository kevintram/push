import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'

import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui'

import { MoveDestinationPicker } from './MoveDestinationPicker'
import { useMoveDestination } from './useMoveDestination'

const styles = stylex.create({
	header: {
		flexDirection: 'column',
	},
})

type CommonMoveCollectionDialogBaseProps = {
	excludeCollectionId?: Id<'collections'>
	isPending: boolean
	onOpenChange: (open: boolean) => void
	title: string
}

// Discriminated union so callers that don't allow root selection
// can't receive a null destination in onMove.
type MoveCollectionDialogBaseProps = CommonMoveCollectionDialogBaseProps &
	(
		| {
				allowRoot: true
				initialDestination: Id<'collections'> | null
				onMove: (destination: Id<'collections'> | null) => void
		  }
		| {
				allowRoot?: false
				initialDestination: Id<'collections'>
				onMove: (destination: Id<'collections'>) => void
		  }
	)

export function MoveCollectionDialogBase(props: MoveCollectionDialogBaseProps) {
	const {
		excludeCollectionId,
		initialDestination,
		isPending,
		onOpenChange,
		title,
	} = props
	const destination = useMoveDestination({
		excludeCollectionId,
		initialDestination,
	})
	const { selectedDestination } = destination
	const canMove = selectedDestination !== initialDestination

	const handleOpenChange = (open: boolean) => {
		if (!isPending) onOpenChange(open)
	}
	const handleMove = () => {
		if (props.allowRoot) {
			props.onMove(selectedDestination)
		} else if (selectedDestination !== null) {
			props.onMove(selectedDestination)
		}
	}

	return (
		<Dialog open onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader xstyle={styles.header}>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>

				<MoveDestinationPicker
					allowRoot={props.allowRoot ?? false}
					destination={destination}
				/>

				<DialogFooter>
					<Button
						disabled={isPending}
						variant='outline'
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						disabled={!canMove || isPending}
						onClick={handleMove}
					>
						{isPending ? 'Moving…' : 'Move'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
