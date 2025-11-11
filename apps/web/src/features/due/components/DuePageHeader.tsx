import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'
import { BookCheck, Check, Logs, SquarePlus, X } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { Separator } from '~/components/ui/Separator'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { useTodoTopicDialog } from '~/features/dialogs/hooks/useTodoTopicDialog'
import { createTodo } from '~/features/due/api'

type SectionKey =
	| 'overdue'
	| 'today'
	| 'tomorrow'
	| 'nextSevenDays'
	| 'future'
	| 'unscheduled'
	| 'logbook'

type ContentType = 'todos' | 'topics'

type FilterId = SectionKey | ContentType

type FilterBadge = {
	id: FilterId
	label: string
	isActive: boolean
	onClick: () => void
}

type DuePageHeaderProps = {
	sectionFilters: Array<FilterBadge>
	contentTypeFilters: Array<FilterBadge>
	onClearFilters: () => void
	onClearContentTypeFilters: () => void
}

export function DuePageHeader({
	sectionFilters,
	contentTypeFilters,
	onClearFilters,
	onClearContentTypeFilters
}: DuePageHeaderProps) {
	const queryClient = useQueryClient()
	const { openTodoDialog } = useTodoTopicDialog()

	const { mutateAsync: createTodoMutation } = useMutation({
		mutationFn: createTodo,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	const handleAddTodo = useCallback(async () => {
		const todo = await createTodoMutation({
			description: '',
			scheduledAt: null,
			completedAt: null
		})
		openTodoDialog(todo.id)
	}, [createTodoMutation, openTodoDialog])

	const handleLogNow = useCallback(async () => {
		const todo = await createTodoMutation({
			description: '',
			scheduledAt: null,
			completedAt: dayjs().format('YYYY-MM-DD')
		})
		openTodoDialog(todo.id)
	}, [createTodoMutation, openTodoDialog])

	const activeSectionFilters = sectionFilters.filter(filter => filter.isActive)
	const inactiveSectionFilters = sectionFilters.filter(
		filter => !filter.isActive
	)
	const hasActiveSectionFilters = activeSectionFilters.length > 0

	const activeContentTypeFilters = contentTypeFilters.filter(
		filter => filter.isActive
	)
	const inactiveContentTypeFilters = contentTypeFilters.filter(
		filter => !filter.isActive
	)
	const hasActiveContentTypeFilters = activeContentTypeFilters.length > 0

	type RenderedFilter =
		| { key: FilterId; type: 'filter'; filter: FilterBadge }
		| { key: 'clear' | 'clear-content'; type: 'clear' }
		| { key: 'separator' | 'separator-content'; type: 'separator' }

	const renderedFilters: Array<RenderedFilter> = useMemo(() => {
		// Build content type filters
		const contentFilters: Array<RenderedFilter> = hasActiveContentTypeFilters
			? [
					...activeContentTypeFilters.map(filter => ({
						key: filter.id,
						type: 'filter' as const,
						filter
					})),
					{ key: 'clear-content' as const, type: 'clear' as const },
					...inactiveContentTypeFilters.map(filter => ({
						key: filter.id,
						type: 'filter' as const,
						filter
					}))
				]
			: contentTypeFilters.map(filter => ({
					key: filter.id,
					type: 'filter' as const,
					filter
				}))

		// Build section filters
		const sectionBaseFilters: Array<RenderedFilter> = hasActiveSectionFilters
			? [
					...activeSectionFilters.map(filter => ({
						key: filter.id,
						type: 'filter' as const,
						filter
					})),
					{ key: 'clear' as const, type: 'clear' as const },
					...inactiveSectionFilters.map(filter => ({
						key: filter.id,
						type: 'filter' as const,
						filter
					}))
				]
			: sectionFilters.map(filter => ({
					key: filter.id,
					type: 'filter' as const,
					filter
				}))

		// Insert separator before logbook filter (only if logbook is not active)
		const logbookIndex = sectionBaseFilters.findIndex(
			item => item.type === 'filter' && item.filter.id === 'logbook'
		)
		const isLogbookActive = sectionBaseFilters.some(
			item =>
				item.type === 'filter' &&
				item.filter.id === 'logbook' &&
				item.filter.isActive
		)
		if (logbookIndex !== -1 && !isLogbookActive) {
			sectionBaseFilters.splice(logbookIndex, 0, {
				key: 'separator' as const,
				type: 'separator' as const
			})
		}

		// Combine content type and section filters with separator
		return [
			...contentFilters,
			{ key: 'separator-content' as const, type: 'separator' as const },
			...sectionBaseFilters
		]
	}, [
		hasActiveContentTypeFilters,
		activeContentTypeFilters,
		inactiveContentTypeFilters,
		contentTypeFilters,
		hasActiveSectionFilters,
		activeSectionFilters,
		inactiveSectionFilters,
		sectionFilters
	])

	return (
		<div className='sticky top-0 z-10 flex flex-col gap-2 rounded-tl-sm border-tl-2 border-b-1 bg-primary-foreground/40 px-4 pt-4 pb-1 backdrop-blur-sm'>
			<div className='flex items-center justify-between'>
				<h1 className='font-bold text-xl'>Due</h1>
				<TooltipProvider>
					<div className='flex items-center gap-1'>
						<Tooltip>
							<TooltipTrigger asChild={true}>
								<Button onClick={handleLogNow} size='sm' variant='ghost'>
									<BookCheck />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Log Review Now</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild={true}>
								<Button onClick={handleAddTodo} size='sm' variant='ghost'>
									<SquarePlus />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Add Todo</TooltipContent>
						</Tooltip>
					</div>
				</TooltipProvider>
			</div>
			{/* Filters Row */}
			<div className='top-0 pb-1'>
				<motion.div
					className='flex flex-wrap items-center gap-2'
					layout={true}
					transition={{ duration: 0.2, ease: 'easeInOut' }}
				>
					{renderedFilters.map(item => {
						if (item.type === 'clear') {
							return (
								<motion.div
									key={item.key}
									layout={true}
									transition={{ duration: 0.2, ease: 'easeInOut' }}
								>
									<Badge
										aria-label={
											item.key === 'clear-content'
												? 'Clear content type filters'
												: 'Clear section filters'
										}
										className='flex cursor-pointer items-center gap-1'
										onClick={
											item.key === 'clear-content'
												? onClearContentTypeFilters
												: onClearFilters
										}
										variant='secondary'
									>
										<X className='h-4 w-4' />
									</Badge>
								</motion.div>
							)
						}

						if (item.type === 'separator') {
							return (
								<motion.div
									className='h-5 px-2'
									key={item.key}
									layout={true}
									transition={{ duration: 0.2, ease: 'easeInOut' }}
								>
									<Separator orientation='vertical' />
								</motion.div>
							)
						}

						if (item.type === 'filter') {
							return (
								<motion.div
									key={item.key}
									layout={true}
									transition={{ duration: 0.2, ease: 'easeInOut' }}
								>
									<Badge
										className='flex cursor-pointer items-center gap-1'
										onClick={item.filter.onClick}
										variant={item.filter.isActive ? 'default' : 'outline'}
									>
										{item.filter.id === 'logbook' ? (
											<Logs aria-hidden='true' className='h-4 w-4' />
										) : (
											item.filter.isActive && (
												<Check aria-hidden='true' className='h-4 w-4' />
											)
										)}
										{item.filter.label}
									</Badge>
								</motion.div>
							)
						}
						return null
					})}
				</motion.div>
			</div>
		</div>
	)
}
