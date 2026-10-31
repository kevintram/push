import { Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

import { toast } from './toastManager'
import { toastTitle } from './toastTitle'

/** Confirms a permanent deletion, with no follow-up actions. */
export function toastDeleted(name: ReactNode) {
	toast.add({
		title: toastTitle('Deleted ', name),
		type: 'success',
		data: { icon: Trash2 },
	})
}
