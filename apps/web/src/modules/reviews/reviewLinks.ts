import { BellRing, Calendar, Flag, Sparkles } from 'lucide-react'

/** Icon for new, never-reviewed cards. */
export const NEW_ICON = Sparkles

/** Review queue links shared by the expanded and collapsed sidebars. */
export const REVIEW_LINKS = [
	{ icon: Calendar, label: 'Due', queueKey: 'due', to: '/review/due' },
	{ icon: NEW_ICON, label: 'New', queueKey: 'new', to: '/review/new' },
	{ icon: BellRing, label: 'Late', queueKey: 'late', to: '/review/late' },
	{
		icon: Flag,
		label: 'Flagged',
		queueKey: 'flagged',
		to: '/review/flagged',
	},
] as const
