import {
	Dialog,
	DialogContent,
	type DialogHandle,
	DialogTitle,
} from '~/components/ui'

type FocusOverlayProps = {
	handle: DialogHandle
}

export function FocusOverlay({ handle }: FocusOverlayProps) {
	return (
		<Dialog handle={handle}>
			<DialogContent size='fullscreen'>
				<DialogTitle>FOCUS MODE</DialogTitle>
			</DialogContent>
		</Dialog>
	)
}
