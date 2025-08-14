import { Baby, Plus, User2 } from 'lucide-react'
import { Badge } from '~/components/ui/Badge'
import { Card } from '~/components/ui/Card'
import { Separator } from '~/components/ui/Separator'
// import { Separator } from '~/components/ui/Separator'
import type { Topic } from '~/types/topics.types'

interface TopicFamilyPanelProps {
	topic: Topic
	onTopicSelected?: (topic: Topic) => void
}

export function TopicFamilyPanel({
	topic,
	onTopicSelected
}: TopicFamilyPanelProps) {
	return (
		<Card className='w-full px-3 shadow-sm'>
			<div className='space-y-4'>
				{/* Parents */}
				<div className='flex flex-wrap items-center gap-2'>
					<div className='flex items-center gap-2'>
						<User2 className='h-4 w-4' />
						<span className='font-medium text-muted-foreground text-xs'>
							Parents
						</span>
					</div>
					{topic.parents?.map(parent => (
						<Badge
							className='cursor-pointer px-2 py-0.5 text-xs hover:bg-secondary/80'
							key={parent}
							variant='secondary'
						>
							{parent}
						</Badge>
					))}
					<Badge
						className='cursor-pointer border-dashed px-1.5 py-0.5 text-xs hover:bg-muted/50'
						variant='outline'
					>
						<Plus className='h-3 w-3' />
					</Badge>
				</div>

				<Separator />

				{/* Children */}
				<div className='flex flex-wrap items-center gap-2'>
					<div className='flex items-center gap-2'>
						<Baby className='h-4 w-4' />
						<span className='font-medium text-muted-foreground text-xs'>
							Children
						</span>
					</div>
					{topic.children.map((child: Topic) => (
						<Badge
							className='cursor-pointer px-2 py-0.5 text-xs hover:bg-secondary/80'
							key={child.id}
							onClick={() => onTopicSelected?.(child)}
							variant='secondary'
						>
							{child.title}
						</Badge>
					))}
					<Badge
						className='cursor-pointer border-dashed px-1.5 py-0.5 text-xs hover:bg-muted/50'
						variant='outline'
					>
						<Plus className='h-3 w-3' />
					</Badge>
				</div>
			</div>
		</Card>
	)
}
