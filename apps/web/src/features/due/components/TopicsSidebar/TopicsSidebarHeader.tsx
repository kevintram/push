import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { useMemo } from 'react'
import { Badge } from '~/components/ui/Badge'
import { Separator } from '~/components/ui/Separator'
import type { TopicSectionKey } from '~/features/topics/api/useSectionedTopics'

type FilterId = TopicSectionKey

type FilterBadge = {
	id: FilterId
	label: string
	isActive: boolean
	onClick: () => void
}

type TopicsSidebarHeaderProps = {
	filters: Array<FilterBadge>
	onClearFilters: () => void
}

export function TopicsSidebarHeader({
	filters,
	onClearFilters
}: TopicsSidebarHeaderProps) {
	const activeFilters = filters.filter(filter => filter.isActive)
	const inactiveFilters = filters.filter(filter => !filter.isActive)
	const hasActiveFilters = activeFilters.length > 0

	type RenderedFilter =
		| { key: FilterId; type: 'filter'; filter: FilterBadge }
		| { key: 'clear'; type: 'clear' }
		| { key: 'separator'; type: 'separator' }

	const renderedFilters: Array<RenderedFilter> = useMemo(() => {
		const baseFilters: Array<RenderedFilter> = hasActiveFilters
			? [
					...activeFilters.map(filter => ({
						key: filter.id,
						type: 'filter' as const,
						filter
					})),
					{ key: 'clear' as const, type: 'clear' as const },
					...inactiveFilters.map(filter => ({
						key: filter.id,
						type: 'filter' as const,
						filter
					}))
				]
			: filters.map(filter => ({
					key: filter.id,
					type: 'filter' as const,
					filter
				}))

		return baseFilters
	}, [hasActiveFilters, activeFilters, inactiveFilters, filters])

	return (
		<div className='sticky top-0 z-10 flex flex-col gap-2 border-b-1 bg-sidebar/40 p-2 backdrop-blur-sm'>
			<h1 className='font-semibold text-lg'>Due Topics</h1>
			<motion.div
				className='flex flex-wrap items-center gap-2 pb-1'
				layout={true}
				transition={{ duration: 0.2, ease: 'easeInOut' }}
			>
				{renderedFilters.map(item => {
					if (item.type === 'clear') {
						return (
							<motion.div
								key='clear'
								layout={true}
								transition={{ duration: 0.2, ease: 'easeInOut' }}
							>
								<Badge
									aria-label='Clear filters'
									className='flex cursor-pointer items-center gap-1'
									onClick={onClearFilters}
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
								key='separator'
								layout={true}
								transition={{ duration: 0.2, ease: 'easeInOut' }}
							>
								<Separator orientation='vertical' />
							</motion.div>
						)
					}

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
								{item.filter.isActive && (
									<Check aria-hidden='true' className='h-4 w-4' />
								)}
								{item.filter.label}
							</Badge>
						</motion.div>
					)
				})}
			</motion.div>
		</div>
	)
}
