import {
	CircleCheck,
	CircleDashed,
	LoaderCircle,
	type LucideIcon,
	PauseCircle
} from 'lucide-react'
import type { ReadingStatus } from '../types/note.types'

export type ReadingStatusOption = {
	value: ReadingStatus
	label: string
	icon: LucideIcon
	colorClassName: string
}

export const READING_STATUS_OPTIONS: Array<ReadingStatusOption> = [
	{
		value: 'NEW',
		label: 'New',
		icon: CircleDashed,
		colorClassName: 'text-zinc-600 dark:text-zinc-400'
	},
	{
		value: 'IN_PROGRESS',
		label: 'In Progress',
		icon: LoaderCircle,
		colorClassName: 'text-blue-600 dark:text-blue-400'
	},
	{
		value: 'ON_HOLD',
		label: 'On Hold',
		icon: PauseCircle,
		colorClassName: 'text-amber-600 dark:text-amber-400'
	},
	{
		value: 'FINISHED',
		label: 'Finished',
		icon: CircleCheck,
		colorClassName: 'text-emerald-600 dark:text-emerald-400'
	}
]

const DEFAULT_READING_STATUS_OPTION: ReadingStatusOption = {
	value: 'NEW',
	label: 'New',
	icon: CircleDashed,
	colorClassName: 'text-zinc-600 dark:text-zinc-400'
}

export function getReadingStatusOption(
	status: ReadingStatus | null | undefined
): ReadingStatusOption {
	return (
		READING_STATUS_OPTIONS.find(option => option.value === status) ??
		DEFAULT_READING_STATUS_OPTION
	)
}
