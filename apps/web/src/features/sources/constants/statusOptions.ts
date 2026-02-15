import {
	CircleCheck,
	CircleDashed,
	CircleX,
	LoaderCircle,
	type LucideIcon,
	PauseCircle
} from 'lucide-react'
import type { SourceLifecycleStatus } from '../types/source.types'

export type SourceStatusOption = {
	value: SourceLifecycleStatus
	label: string
	icon: LucideIcon
	colorClassName: string
}

export const SOURCE_STATUS_OPTIONS: Array<SourceStatusOption> = [
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
		value: 'DROPPED',
		label: 'Dropped',
		icon: CircleX,
		colorClassName: 'text-rose-600 dark:text-rose-400'
	},
	{
		value: 'COMPLETED',
		label: 'Completed',
		icon: CircleCheck,
		colorClassName: 'text-emerald-600 dark:text-emerald-400'
	}
]

const DEFAULT_SOURCE_STATUS_OPTION: SourceStatusOption = {
	value: 'NEW',
	label: 'New',
	icon: CircleDashed,
	colorClassName: 'text-zinc-600 dark:text-zinc-400'
}

export function getSourceStatusOption(
	status: SourceLifecycleStatus | null | undefined
): SourceStatusOption {
	return (
		SOURCE_STATUS_OPTIONS.find(option => option.value === status) ??
		DEFAULT_SOURCE_STATUS_OPTION
	)
}
