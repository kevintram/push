import { BellRing, Calendar, Flag, Sparkles } from 'lucide-react'

/** Label, icon, and route for each review queue. */
export const reviewQueues = {
	due: { label: 'Due', Icon: Calendar, to: '/review/due' },
	new: { label: 'New', Icon: Sparkles, to: '/review/new' },
	late: { label: 'Late', Icon: BellRing, to: '/review/late' },
	flagged: { label: 'Flagged', Icon: Flag, to: '/review/flagged' },
} as const

export type ReviewQueueKey = keyof typeof reviewQueues

/** Queue order in the expanded and collapsed sidebars. */
export const reviewQueueKeys: ReadonlyArray<ReviewQueueKey> = [
	'due',
	'new',
	'late',
	'flagged',
]
