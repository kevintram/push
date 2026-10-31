import { toastError } from './toastError'
import { toast } from './toastManager'

// Longer than the default, so there is time to reach the button.
const UNDO_TIMEOUT = 8000

// Only the latest action can be undone, since undoing an earlier one could
// overwrite a later change to the same items.
let latestUndoId: string | undefined

/**
 * Confirms a finished action with `title` and an Undo button that runs `undo`,
 * taking the button off the previous undo toast, which stays as a record of
 * its action. A failed undo shows its own error toast.
 */
export function toastUndo(title: string, undo: () => Promise<unknown>) {
	if (latestUndoId !== undefined) {
		toast.update(latestUndoId, { actionProps: undefined })
	}

	// The button still takes clicks while the toast animates out, and a second
	// undo would fail, as when deleting a review twice.
	let isUndone = false
	const id = toast.add({
		actionProps: {
			children: 'Undo',
			onClick: () => {
				if (isUndone) return
				isUndone = true
				toast.close(id)
				undo().catch((error: unknown) =>
					toastError('Failed to undo', error),
				)
			},
		},
		timeout: UNDO_TIMEOUT,
		title,
		type: 'success',
	})
	latestUndoId = id
}
