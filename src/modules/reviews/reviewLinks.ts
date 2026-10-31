import { BellRing, Calendar, Flag, Sparkles } from 'lucide-react'

import { appHotkeys } from '~/modules/shortcuts/appHotkeys'

/**
 * Review queue links shared by the expanded and collapsed sidebars, each
 * with the `G` sequence that goes to it.
 */
export const REVIEW_LINKS = [
	{
		icon: Calendar,
		label: 'Due',
		queueKey: 'due',
		to: '/review/due',
		hotkey: appHotkeys.goToDue,
	},
	{
		icon: Sparkles,
		label: 'New',
		queueKey: 'new',
		to: '/review/new',
		hotkey: appHotkeys.goToNew,
	},
	{
		icon: BellRing,
		label: 'Late',
		queueKey: 'late',
		to: '/review/late',
		hotkey: appHotkeys.goToLate,
	},
	{
		icon: Flag,
		label: 'Flagged',
		queueKey: 'flagged',
		to: '/review/flagged',
		hotkey: appHotkeys.goToFlagged,
	},
] as const
