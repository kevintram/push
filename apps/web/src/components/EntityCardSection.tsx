import { ChevronDown } from 'lucide-react'
import { memo, useCallback } from 'react'
import {
	EntityCard,
	type EntityItem,
	estimateEntitySize,
	getEntityKey
} from '~/components/EntityCard'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Button } from '~/components/ui/button'
import { CountBadge } from '~/components/ui/count-badge'
import { PracticeActionMenu } from '~/features/practices/components/PracticeActionMenu'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'

export const EntityCardSection = memo(function EntityCardSection({
	id,
	label,
	items,
	isCollapsed,
	onToggleCollapse,
	onEntityClick
}: {
	id: string
	label: string
	items: Array<EntityItem>
	isCollapsed: boolean
	onToggleCollapse: (sectionId: string) => void
	onEntityClick: (entity: EntityItem) => void
}) {
	const renderItem = useCallback(
		(entity: EntityItem) => {
			let headerRight: React.ReactNode
			switch (entity.type) {
				case 'topic':
					headerRight = <TopicActionMenu topic={entity.item} />
					break
				case 'source':
					headerRight = <SourceActionMenu source={entity.item} />
					break
				case 'practice':
					headerRight = <PracticeActionMenu practice={entity.item} />
					break
				default:
					break
			}
			return (
				<EntityCard
					entity={entity}
					headerRight={headerRight}
					minHeight={96}
					onEntityClick={onEntityClick}
				/>
			)
		},
		[onEntityClick]
	)

	return (
		<div className='mb-2'>
			<div className='flex items-center justify-between'>
				<Button
					className='flex items-center gap-2 p-0'
					onClick={() => onToggleCollapse(id)}
					variant='ghost'
				>
					<h2 className='flex items-center gap-2 font-bold text-xl'>
						{label} <CountBadge count={items.length} />
					</h2>
					<ChevronDown
						className={`h-5 w-5 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
					/>
				</Button>
			</div>

			{!isCollapsed && (
				<div className='mt-2 mb-10 ml-5'>
					<MasonryLayout
						estimateItemSize={estimateEntitySize}
						getItemKey={getEntityKey}
						items={items}
						renderItem={renderItem}
					/>
				</div>
			)}
		</div>
	)
})
