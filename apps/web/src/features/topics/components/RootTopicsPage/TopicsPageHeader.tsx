import { Plus } from 'lucide-react'
import { Button } from '~/components/ui/Button'
import { FilterBadges, type RenderedFilter } from './FilterBadges'

type TopicsPageHeaderProps = {
	onCreateTopic: () => void
	renderedFilters: Array<RenderedFilter>
	onClearFilters: () => void
}

export function TopicsPageHeader({
	onCreateTopic,
	renderedFilters,
	onClearFilters
}: TopicsPageHeaderProps) {
	return (
		<div className='sticky top-0 z-10 rounded-tl-sm border-tl-2 bg-primary-foreground px-4 pt-4 pb-0'>
			<div className='flex items-center justify-between'>
				<h1 className='font-bold text-xl'>Library</h1>
				<Button onClick={onCreateTopic} size='icon' variant='ghost'>
					<Plus />
				</Button>
			</div>
			<div className='py-2'>
				<FilterBadges
					onClearFilters={onClearFilters}
					renderedFilters={renderedFilters}
				/>
			</div>
		</div>
	)
}
