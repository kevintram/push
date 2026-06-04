import type { ReactNode } from 'react'
import { useMemo } from 'react'
import {
	Breadcrumb,
	BreadcrumbEllipsis,
	BreadcrumbItem,
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
import { useElementSize } from '~/hooks/useResizeObserver'
import { cn } from '~/lib/utils'
import { getTopicDisplayTitle } from '~/modules/topics/utils/topicTree'

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
	| {
			kind: 'ellipsis'
			hiddenTopics: Array<TopicPathItem>
			key: string
	  }
	| { kind: 'topic'; topic: TopicPathItem }

interface TopicBreadcrumbProps {
	ariaLabel: string
	className?: string
	currentTopicId: number
	leadingHiddenTopics?: Array<TopicPathItem>
	onHiddenTopicSelect: (topic: TopicPathItem) => void
	renderTopicLink: (args: {
		className: string
		label: string
		topic: TopicPathItem
	}) => ReactNode
	topicPath: Array<TopicPathItem>
}

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
		return topicPath.map(topic => ({ kind: 'topic' as const, topic }))
	}

	const leadingTopics = topicPath.slice(0, LEADING_COUNT)
	const trailingTopics = topicPath.slice(-tier.trailingCount)
	const hiddenTopics = topicPath.slice(
		LEADING_COUNT,
		topicPath.length - tier.trailingCount
	)

	if (hiddenTopics.length === 0) {
		return topicPath.map(topic => ({ kind: 'topic' as const, topic }))
	}

	if (hiddenTopics.length === 1) {
		return [
			...leadingTopics.map(topic => ({ kind: 'topic' as const, topic })),
			...hiddenTopics.map(topic => ({ kind: 'topic' as const, topic })),
			...trailingTopics.map(topic => ({ kind: 'topic' as const, topic }))
		]
	}

	return [
		...leadingTopics.map(topic => ({ kind: 'topic' as const, topic })),
		{
			kind: 'ellipsis' as const,
			hiddenTopics,
			key: `ellipsis-${hiddenTopics[0]?.id ?? 'start'}-${hiddenTopics.at(-1)?.id ?? 'end'}`
		},
		...trailingTopics.map(topic => ({ kind: 'topic' as const, topic }))
	]
}

function TopicPathBreadcrumbItem({
	currentTopicId,
	renderTopicLink,
	topic
}: {
	currentTopicId: number
	renderTopicLink: (args: {
		className: string
		label: string
		topic: TopicPathItem
	}) => ReactNode
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
				renderTopicLink({
					className:
						'block @[300px]/crumbs:max-w-[6.5rem] @[380px]/crumbs:max-w-[7.5rem] @[460px]/crumbs:max-w-36 @[560px]/crumbs:max-w-40 max-w-20 truncate',
					label,
					topic
				})
			)}
		</BreadcrumbItem>
	)
}

export function TopicBreadcrumb({
	ariaLabel,
	className,
	currentTopicId,
	leadingHiddenTopics = [],
	onHiddenTopicSelect,
	renderTopicLink,
	topicPath
}: TopicBreadcrumbProps) {
	const { ref, width } = useElementSize<HTMLDivElement>()

	const tier = useMemo(() => getBreadcrumbTier(width), [width])
	const visibleTopicPath = useMemo(() => {
		const compactedTopicPath = buildVisibleTopicPath(topicPath, tier)
		if (leadingHiddenTopics.length === 0) return compactedTopicPath
		if (leadingHiddenTopics.length === 1) {
			const leadingTopic = leadingHiddenTopics[0]
			if (leadingTopic == null) return compactedTopicPath

			return [
				{ kind: 'topic' as const, topic: leadingTopic },
				...compactedTopicPath
			]
		}

		return [
			{
				kind: 'ellipsis' as const,
				hiddenTopics: leadingHiddenTopics,
				key: `leading-ellipsis-${leadingHiddenTopics[0]?.id ?? 'start'}-${leadingHiddenTopics.at(-1)?.id ?? 'end'}`
			},
			...compactedTopicPath
		]
	}, [leadingHiddenTopics, tier, topicPath])

	return (
		<div className={cn('@container/crumbs min-w-0', className)} ref={ref}>
			<Breadcrumb aria-label={ariaLabel} className='min-w-0'>
				<BreadcrumbList className='min-w-0 flex-nowrap overflow-hidden'>
					{visibleTopicPath.map((entry, index) => {
						const entryKey = entry.kind === 'topic' ? entry.topic.id : entry.key

						const breadcrumbEntry =
							entry.kind === 'ellipsis' ? (
								<BreadcrumbItem className='shrink-0' key={entryKey}>
									<DropdownMenu>
										<DropdownMenuTrigger
											render={
												<Button
													aria-label='Show hidden topics'
													className='rounded-sm text-muted-foreground'
													size='icon-xs'
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
																onHiddenTopicSelect(hiddenTopic)
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
									renderTopicLink={renderTopicLink}
									topic={entry.topic}
								/>
							)

						return [
							index > 0 ? (
								<BreadcrumbSeparator
									className='shrink-0'
									key={`separator-${entryKey}`}
								/>
							) : null,
							breadcrumbEntry
						]
					})}
				</BreadcrumbList>
			</Breadcrumb>
		</div>
	)
}
