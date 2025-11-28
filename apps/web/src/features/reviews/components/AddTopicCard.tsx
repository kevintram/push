import dayjs from 'dayjs'
import { Calendar } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { Card, CardContent, CardFooter } from '~/components/ui/Card'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import type { Topic } from '~/models/review-topic.types'
import { highlightText, truncateWithHighlight } from '~/utils/textHighlight'

interface AddTopicCardProps {
	topic: Topic
	onTopicClick: (topic: Topic) => void
	searchQuery?: string
	minHeight?: number
}

export function AddTopicCard({
	topic,
	onTopicClick,
	searchQuery,
	minHeight = 72
}: AddTopicCardProps) {
	// Search highlighting
	const highlightedName = useMemo(() => {
		if (!topic.name) return null
		if (!searchQuery?.trim()) return topic.name
		return highlightText({ text: topic.name, query: searchQuery })
	}, [topic.name, searchQuery])

	const highlightedNotes = useMemo(() => {
		if (!topic.notes) return null
		if (!searchQuery?.trim()) return topic.notes
		return truncateWithHighlight(topic.notes, searchQuery, 200)
	}, [topic.notes, searchQuery])

	// Due date formatting
	const dueDateDisplay = useMemo(() => {
		if (!topic.due) return null

		const now = dayjs().startOf('day')
		const dueDayjs = dayjs(topic.due).startOf('day')
		const diffDays = dueDayjs.diff(now, 'day')
		const isUpcoming = dueDayjs.isAfter(now)

		let displayText: string
		if (diffDays === 0) {
			displayText = 'Today'
		} else if (diffDays === 1) {
			displayText = 'Tomorrow'
		} else if (diffDays === -1) {
			displayText = 'Yesterday'
		} else if (isUpcoming) {
			displayText = `in ${diffDays}d`
		} else {
			displayText = `${Math.abs(diffDays)}d ago`
		}

		return {
			dueDate: topic.due,
			isUpcoming,
			displayText
		}
	}, [topic.due])

	const dueDateColorClass =
		dueDateDisplay?.displayText === 'Today'
			? 'text-blue-600 dark:text-blue-400'
			: dueDateDisplay?.displayText === 'Yesterday' ||
					dueDateDisplay?.displayText.includes('ago')
				? 'text-red-600 dark:text-red-400'
				: ''

	// Click handlers
	const handleClick = useCallback(() => {
		onTopicClick(topic)
	}, [onTopicClick, topic])

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault()
				handleClick()
			}
		},
		[handleClick]
	)

	return (
		<Card
			className='cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			style={{ minHeight: `${minHeight}px` }}
			tabIndex={0}
		>
			<CardContent className='flex flex-1 flex-col gap-0.5'>
				{highlightedName && (
					<h3 className='break-word font-semibold leading-tight [overflow-wrap:anywhere]'>
						{highlightedName}
					</h3>
				)}
				{highlightedNotes && (
					<p className='break-word text-sm [overflow-wrap:anywhere]'>
						{highlightedNotes}
					</p>
				)}
			</CardContent>

			{/* Bottom row: Due date */}
			<CardFooter className='text-muted-foreground text-xs'>
				{dueDateDisplay ? (
					<Tooltip>
						<TooltipTrigger asChild={true}>
							<div className='flex items-center gap-1'>
								<Calendar className={`h-3 w-3 ${dueDateColorClass}`} />
								<span className={dueDateColorClass}>
									{dueDateDisplay.displayText}
								</span>
							</div>
						</TooltipTrigger>
						<TooltipContent side='bottom'>
							Due on {dayjs(dueDateDisplay.dueDate).format('MMMM D, YYYY')}
						</TooltipContent>
					</Tooltip>
				) : (
					<Tooltip>
						<TooltipTrigger asChild={true}>
							<div className='flex items-center gap-1'>
								<Calendar className='h-3 w-3' />
								<span>None</span>
							</div>
						</TooltipTrigger>
						<TooltipContent side='bottom'>No due date</TooltipContent>
					</Tooltip>
				)}
			</CardFooter>
		</Card>
	)
}
