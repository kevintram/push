import { BookOpen } from 'lucide-react'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import {
	EntityCard,
	type EntityItem,
	estimateEntitySize,
	getEntityKey
} from '~/components/EntityCard'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import { CountBadge } from '~/components/ui/count-badge'
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useSources } from '~/features/sources/api/getSources'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import type {
	Source,
	SourceLifecycleStatus
} from '~/features/sources/types/source.types'
import { useEntityNavigation } from '~/hooks/useEntityNavigation'

type ReadTab = 'read' | 'on-hold' | 'dropped' | 'finished'

type SourceEntityItem = Extract<EntityItem, { type: 'source' }>

type SourceSection = {
	id: string
	label: string
	items: Array<SourceEntityItem>
}

const READ_TAB_OPTIONS: Array<{ value: ReadTab; label: string }> = [
	{ value: 'read', label: 'Read' },
	{ value: 'on-hold', label: 'On Hold' },
	{ value: 'dropped', label: 'Dropped' },
	{ value: 'finished', label: 'Finished' }
]

function isReadTab(value: string): value is ReadTab {
	return READ_TAB_OPTIONS.some(option => option.value === value)
}

function toSourceItems(sources: Array<Source>): Array<SourceEntityItem> {
	return sources.map(source => ({
		type: 'source',
		item: source
	}))
}

function bucketSourcesByStatus(sources: Array<Source>) {
	const buckets: Record<SourceLifecycleStatus, Array<Source>> = {
		NEW: [],
		IN_PROGRESS: [],
		ON_HOLD: [],
		DROPPED: [],
		FINISHED: []
	}

	for (const source of sources) {
		buckets[source.status].push(source)
	}

	return buckets
}

function getEmptyStateCopy(activeTab: ReadTab) {
	switch (activeTab) {
		case 'read':
			return {
				title: 'No sources to read',
				description: 'Set a source to New or In Progress to show it here'
			}
		case 'on-hold':
			return {
				title: 'No sources on hold',
				description: 'Sources marked On Hold will show up here'
			}
		case 'dropped':
			return {
				title: 'No dropped sources',
				description: 'Sources marked Dropped will show up here'
			}
		case 'finished':
			return {
				title: 'No finished sources',
				description: 'Sources marked Finished will show up here'
			}
		default:
			return {
				title: 'No sources',
				description: 'Sources will show up here once available'
			}
	}
}

export function ReadPage() {
	const handleEntityClick = useEntityNavigation()
	const [activeTab, setActiveTab] = useState<ReadTab>('read')

	const { data: sources = [], isLoading } = useSources({
		archived: false,
		order: 'desc',
		orderBy: 'updated_at'
	})

	const statusBuckets = useMemo(() => {
		const sortedSources = [...sources].sort(
			(a, b) =>
				new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
		)
		return bucketSourcesByStatus(sortedSources)
	}, [sources])

	const tabCounts = useMemo(
		() => ({
			read: statusBuckets.IN_PROGRESS.length + statusBuckets.NEW.length,
			'on-hold': statusBuckets.ON_HOLD.length,
			dropped: statusBuckets.DROPPED.length,
			finished: statusBuckets.FINISHED.length
		}),
		[statusBuckets]
	)

	const sections = useMemo<Array<SourceSection>>(() => {
		if (activeTab === 'read') {
			const readSections: Array<SourceSection> = [
				{
					id: 'in-progress',
					label: 'In Progress',
					items: toSourceItems(statusBuckets.IN_PROGRESS)
				},
				{
					id: 'new',
					label: 'New',
					items: toSourceItems(statusBuckets.NEW)
				}
			]

			return readSections.filter(section => section.items.length > 0)
		}

		if (activeTab === 'on-hold') {
			return [
				{
					id: 'on-hold',
					label: 'On Hold',
					items: toSourceItems(statusBuckets.ON_HOLD)
				}
			]
		}

		if (activeTab === 'dropped') {
			return [
				{
					id: 'dropped',
					label: 'Dropped',
					items: toSourceItems(statusBuckets.DROPPED)
				}
			]
		}

		return [
			{
				id: 'finished',
				label: 'Finished',
				items: toSourceItems(statusBuckets.FINISHED)
			}
		]
	}, [activeTab, statusBuckets])

	const visibleSections = useMemo(
		() => sections.filter(section => section.items.length > 0),
		[sections]
	)

	const emptyStateCopy = useMemo(
		() => getEmptyStateCopy(activeTab),
		[activeTab]
	)

	const renderItem = useCallback(
		(entity: SourceEntityItem) => (
			<EntityCard
				entity={entity}
				headerRight={<SourceActionMenu source={entity.item} />}
				minHeight={96}
				onEntityClick={handleEntityClick}
			/>
		),
		[handleEntityClick]
	)

	return (
		<PageLayout>
			<PageLayout.Header icon={BookOpen} title='Read'>
				<Tabs
					className='-mb-2'
					onValueChange={value => {
						if (isReadTab(value)) {
							setActiveTab(value)
						}
					}}
					value={activeTab}
				>
					<TabsList className='border-b-0' variant='line'>
						{READ_TAB_OPTIONS.map(tab => (
							<TabsTrigger className='gap-2' key={tab.value} value={tab.value}>
								<span>{tab.label}</span>
								<CountBadge
									className='h-4 min-w-4 px-1 text-[10px]'
									count={tabCounts[tab.value]}
								/>
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			</PageLayout.Header>
			<PageLayout.Content className='max-w-screen p-6'>
				<ReadSections
					emptyDescription={emptyStateCopy.description}
					emptyTitle={emptyStateCopy.title}
					isLoading={isLoading}
					renderItem={renderItem}
					sections={visibleSections}
				/>
			</PageLayout.Content>
		</PageLayout>
	)
}

function ReadSections({
	sections,
	isLoading,
	emptyTitle,
	emptyDescription,
	renderItem
}: {
	sections: Array<SourceSection>
	isLoading: boolean
	emptyTitle: string
	emptyDescription: string
	renderItem: (entity: SourceEntityItem) => ReactNode
}) {
	if (isLoading) {
		return <MasonryLayoutSkeleton />
	}

	if (sections.length === 0) {
		return (
			<div className='py-6'>
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<BookOpen />
						</EmptyMedia>
						<EmptyTitle>{emptyTitle}</EmptyTitle>
						<EmptyDescription>{emptyDescription}</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			{sections.map(section => (
				<div className='space-y-3' key={section.id}>
					<h2 className='font-semibold text-lg'>{section.label}</h2>
					<MasonryLayout
						estimateItemSize={estimateEntitySize}
						gap={16}
						getItemKey={getEntityKey}
						items={section.items}
						renderItem={renderItem}
					/>
				</div>
			))}
		</div>
	)
}
