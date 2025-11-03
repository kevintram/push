import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { Badge } from '~/components/ui/Badge'

export type FilterId = 'archived' | 'inboxed'

export type FilterBadge = {
	id: FilterId
	label: string
	icon: React.ReactNode
	isActive: boolean
	onClick: () => void
}

export type RenderedFilter =
	| { key: FilterId; type: 'filter'; filter: FilterBadge }
	| { key: 'clear'; type: 'clear' }

type FilterBadgesProps = {
	renderedFilters: Array<RenderedFilter>
	onClearFilters: () => void
}

export function FilterBadges({ renderedFilters, onClearFilters }: FilterBadgesProps) {
	return (
		<motion.div
			className='flex flex-wrap items-center gap-2'
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
							{item.filter.isActive ? (
								<Check aria-hidden='true' className='h-4 w-4' />
							) : (
								item.filter.icon
							)}
							{item.filter.label}
						</Badge>
					</motion.div>
				)
			})}
		</motion.div>
	)
}

