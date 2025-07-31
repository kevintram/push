import { Baby, Plus, Users2 } from 'lucide-react'
import { Badge } from '~/components/ui/Badge'
import { Card } from '~/components/ui/Card'
import { Separator } from '~/components/ui/Separator'
import type { Topic } from '~/types/topic-hub'

interface TopicFamilyPanelProps {
	topic: Topic
	onTopicSelect?: (topicName: string) => void
}

export function TopicFamilyPanel({ topic, onTopicSelect }: TopicFamilyPanelProps) {
	return (
		<Card className='w-full shadow-sm px-3'>
			<div className='space-y-4'>
				{/* Parents */}
				<div className='flex items-center gap-2 flex-wrap'>
					<div className='flex items-center gap-2'>
						<Users2 className='h-4 w-4' />
						<span className='text-xs font-medium text-muted-foreground'>
							Parents
						</span>
					</div>
					{topic.parentTitles?.map(parent => (
						<Badge
							className='text-xs py-0.5 px-2 cursor-pointer hover:bg-secondary/80'
							key={parent}
							variant='secondary'
							onClick={() => onTopicSelect?.(parent)}
						>
							{parent}
						</Badge>
					))}
					<Badge
						className='border-dashed cursor-pointer hover:bg-muted/50 text-xs py-0.5 px-1.5'
						variant='outline'
					>
						<Plus className='h-3 w-3' />
					</Badge>
				</div>

				<Separator />

				{/* Children */}
				<div className='flex items-center gap-2 flex-wrap'>
					<div className='flex items-center gap-2'>
						<Baby className='h-4 w-4' />
						<span className='text-xs font-medium text-muted-foreground'>
							Children
						</span>
					</div>
					{topic.childTitles?.map(child => (
						<Badge
							className='text-xs py-0.5 px-2 cursor-pointer hover:bg-secondary/80'
							key={child}
							variant='secondary'
							onClick={() => onTopicSelect?.(child)}
						>
							{child}
						</Badge>
					))}
					<Badge
						className='border-dashed cursor-pointer hover:bg-muted/50 text-xs py-0.5 px-1.5'
						variant='outline'
					>
						<Plus className='h-3 w-3' />
					</Badge>
				</div>
			</div>
		</Card>
	)
}
