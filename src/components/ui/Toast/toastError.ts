import { getErrorMessage } from '~/utils/error'

import { toast } from './toastManager'

/** Shows `title` for a failed request, with its user-facing message if any. */
export function toastError(title: string, error: unknown) {
	toast.add({ description: getErrorMessage(error), title, type: 'error' })
}
