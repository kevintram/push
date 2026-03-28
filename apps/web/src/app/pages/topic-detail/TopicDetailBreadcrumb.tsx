import { Link, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'

import {
	Breadcrumb,
	BreadcrumbEllipsis,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator
} from '~/components/ui/breadcrumb'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { TOPIC_DETAIL_INTENT_PRELOAD_DELAY } from '~/features/topics/hooks/usePrefetchTopicDetail'
import { getTopicDisplayTitle } from '~/features/topics/utils/topicTree'
import { useElementSize } from '~/hooks/useResizeObserver'
import { cn } from '~/lib/utils'

export type TopicPathItem = {
	id: number
	title: string
	body: string
}

type BreadcrumbTier = {
	showFullUpTo: number
	trailingCount: number
}

type VisibleTopicPathEntry =
	| { kind: 'ellipsis'; hiddenTopics: Array<TopicPathItem> }
	| { kind: 'topic'; topic: TopicPathItem }

const LEADING_COUNT = 1

function getBreadcrumbTier(availableWidth: number): BreadcrumbTier {
	if (availableWidth >= 560) return { showFullUpTo: 6, trailingCount: 3 }
	if (availableWidth >= 460) return { showFullUpTo: 5, trailingCount: 3 }
	if (availableWidth >= 380) return { showFullUpTo: 4, trailingCount: 2 }
	if (availableWidth >= 300) return { showFullUpTo: 3, trailingCount: 1 }
	return { showFullUpTo: 2, trailingCount: 1 }
}

function buildVisibleTopicPath(
	topicPath: Array<TopicPathItem>,
	tier: BreadcrumbTier
): Array<VisibleTopicPathEntry> {
	if (topicPath.length <= tier.showFullUpTo) {
		return topicPath.map(t => ({ kind: 'topic' as const, topic: t }))
	}

	const leadingTopics = topicPath.slice(0, LEADING_COUNT)
	const trailingTopics = topicPath.slice(-tier.trailingCount)
	const hiddenTopics = topicPath.slice(
		LEADING_COUNT,
		topicPath.length - tier.trailingCount
	)

	if (hiddenTopics.length === 0) {
		return topicPath.map(t => ({ kind: 'topic' as const, topic: t }))
	}

	return [
		...leadingTopics.map(t => ({ kind: 'topic' as const, topic: t })),
		{ kind: 'ellipsis' as const, hiddenTopics },
		...trailingTopics.map(t => ({ kind: 'topic' as const, topic: t }))
	]
}

function TopicPathBreadcrumbItem({
	currentTopicId,
	topic
}: {
	currentTopicId: number
	topic: TopicPathItem
}) {
	const label = getTopicDisplayTitle(topic.title, topic.body)
	const isCurrentTopic = topic.id === currentTopicId

	return (
		<BreadcrumbItem
			className={cn(
				isCurrentTopic ? 'min-w-0 flex-[1_1_7rem] overflow-hidden' : 'min-w-0'
			)}
		>
			{isCurrentTopic ? (
				<BreadcrumbPage className='block truncate font-medium' title={label}>
					{label}
				</BreadcrumbPage>
			) : (
				<BreadcrumbLink
					className='block @[300px]/crumbs:max-w-[6.5rem] @[380px]/crumbs:max-w-[7.5rem] @[460px]/crumbs:max-w-36 @[560px]/crumbs:max-w-40 max-w-20 truncate'
					render={
						<Link
							params={{ topicId: topic.id.toString() }}
							preload='intent'
							preloadDelay={TOPIC_DETAIL_INTENT_PRELOAD_DELAY}
							to='/topics/$topicId'
						/>
					}
					title={label}
				>
					{label}
				</BreadcrumbLink>
			)}
		</BreadcrumbItem>
	)
}

interface TopicDetailBreadcrumbProps {
	className?: string
	currentTopicId: number
	topicPath: Array<TopicPathItem>
}

export function TopicDetailBreadcrumb({
	className,
	currentTopicId,
	topicPath
}: TopicDetailBreadcrumbProps) {
	const navigate = useNavigate()
	const { ref, width } = useElementSize<HTMLDivElement>()

	const tier = useMemo(() => getBreadcrumbTier(width), [width])

	const visibleTopicPath = useMemo(
		() => buildVisibleTopicPath(topicPath, tier),
		[tier, topicPath]
	)

	return (
		<div className={cn('@container/crumbs min-w-0', className)} ref={ref}>
			<Breadcrumb aria-label='Topic path' className='min-w-0'>
				<BreadcrumbList className='min-w-0 flex-nowrap overflow-hidden'>
					{visibleTopicPath.map((entry, index) => {
						const entryKey =
							entry.kind === 'topic' ? entry.topic.id : 'ellipsis'

						return [
							index > 0 ? (
								<BreadcrumbSeparator
									className='shrink-0'
									key={`separator-${entryKey}`}
								/>
							) : null,
							entry.kind === 'ellipsis' ? (
								<BreadcrumbItem className='shrink-0' key={entryKey}>
									<DropdownMenu>
										<DropdownMenuTrigger
											render={
												<Button
													aria-label='Show hidden topics'
													className='h-6 w-6 rounded-sm text-muted-foreground'
													size='icon-sm'
													variant='ghost'
												>
													<BreadcrumbEllipsis />
												</Button>
											}
										/>
										<DropdownMenuContent
											align='start'
											className='min-w-44 max-w-[min(20rem,calc(100vw-2rem))]'
											matchTriggerWidth={false}
										>
											<DropdownMenuGroup>
												{entry.hiddenTopics.map(hiddenTopic => {
													const label = getTopicDisplayTitle(
														hiddenTopic.title,
														hiddenTopic.body
													)

													return (
														<DropdownMenuItem
															key={hiddenTopic.id}
															onClick={() => {
																void navigate({
																	to: '/topics/$topicId',
																	params: {
																		topicId: hiddenTopic.id.toString()
																	}
																})
															}}
														>
															<span className='block truncate' title={label}>
																{label}
															</span>
														</DropdownMenuItem>
													)
												})}
											</DropdownMenuGroup>
										</DropdownMenuContent>
									</DropdownMenu>
								</BreadcrumbItem>
							) : (
								<TopicPathBreadcrumbItem
									currentTopicId={currentTopicId}
									key={entry.topic.id}
									topic={entry.topic}
								/>
							)
						]
					})}
				</BreadcrumbList>
			</Breadcrumb>
		</div>
	)
}
