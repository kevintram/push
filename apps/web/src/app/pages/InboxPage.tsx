import { useNavigate } from '@tanstack/react-router'
import { Inbox } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import { EmptyStateCreateTopicButton } from '~/components/EmptyStateCreateTopicButton'
import {
	EntityCard,
	type EntityItem,
	estimateEntitySize,
	getEntityKey
} from '~/components/EntityCard'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { useSources } from '~/features/sources/api/getSources'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { useTopics } from '~/features/topics/api/getTopics'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'

const MIN_CARD_WIDTH = 280

export function InboxPage() {
	const navigate = useNavigate()
	const { data: inboxTopics, isLoading: isLoadingTopics } = useTopics({
		inboxed: true,
		archived: false
	})
	const { data: inboxSources, isLoading: isLoadingSources } = useSources({
		inboxed: true,
		archived: false
	})
	const { mutateAsync: createTopic, isPending: isCreatingTopic } =
		useCreateTopic()

	const isLoading = isLoadingTopics || isLoadingSources

	// Combine topics and sources, sorted by updated_at descending
	const inboxItems = useMemo<Array<EntityItem>>(() => {
		const items: Array<EntityItem> = [
			...(inboxTopics ?? []).map(
				(item): EntityItem => ({ type: 'topic', item })
			),
			...(inboxSources ?? []).map(
				(item): EntityItem => ({ type: 'source', item })
			)
		]
		return items.sort(
			(a, b) =>
				new Date(b.item.updated_at).getTime() -
				new Date(a.item.updated_at).getTime()
		)
	}, [inboxTopics, inboxSources])

	const handleEntitySelect = useCallback(
		(entity: EntityItem) => {
			if (entity.type === 'topic') {
				navigate({
					to: '/topics/$topicId',
					params: { topicId: entity.item.id.toString() }
				})
			} else {
				navigate({
					to: '/sources/$sourceId',
					params: { sourceId: entity.item.id.toString() }
				})
			}
		},
		[navigate]
	)

	const handleCreateInboxTopic = useCallback(async () => {
		const newTopic = await createTopic({
			inboxed: true,
			archived: false
		})
		navigate({
			to: '/topics/$topicId',
			params: { topicId: newTopic.id.toString() }
		})
	}, [createTopic, navigate])

	const inboxCountLabel = isLoading ? '...' : inboxItems.length

	return (
		<PageLayout>
			<PageLayout.Header icon={Inbox} title='Inbox'>
				<span className='font-semibold text-muted-foreground text-xl'>
					({inboxCountLabel})
				</span>
			</PageLayout.Header>

			<InboxList
				isCreatingTopic={isCreatingTopic}
				isLoading={isLoading}
				items={inboxItems}
				onCreateInboxTopic={handleCreateInboxTopic}
				onEntitySelect={handleEntitySelect}
			/>
		</PageLayout>
	)
}

function InboxList({
	items,
	onEntitySelect,
	onCreateInboxTopic,
	isLoading,
	isCreatingTopic
}: {
	items: Array<EntityItem>
	onEntitySelect: (entity: EntityItem) => void
	onCreateInboxTopic: () => void
	isLoading: boolean
	isCreatingTopic: boolean
}) {
	const renderItem = useCallback(
		(entity: EntityItem) => (
			<EntityCard
				entity={entity}
				headerRight={
					entity.type === 'topic' ? (
						<TopicActionMenu topic={entity.item} />
					) : (
						<SourceActionMenu source={entity.item} />
					)
				}
				onEntityClick={onEntitySelect}
			/>
		),
		[onEntitySelect]
	)

	if (isLoading) {
		return <MasonryLayoutSkeleton />
	}

	if (items.length === 0) {
		return (
			<PageLayout.Content>
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<Inbox />
						</EmptyMedia>
						<EmptyTitle>Your inbox is empty</EmptyTitle>
						<EmptyDescription>
							The inbox is for items to be processed later: fleeting notes,
							random ideas, whatever
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<EmptyStateCreateTopicButton
							buttonText='Add to your inbox'
							disabled={isCreatingTopic}
							onClick={onCreateInboxTopic}
						/>
					</EmptyContent>
				</Empty>
			</PageLayout.Content>
		)
	}

	return (
		<PageLayout.Content className='max-w-screen p-6'>
			<MasonryLayout
				estimateItemSize={estimateEntitySize}
				gap={16}
				getItemKey={getEntityKey}
				items={items}
				minItemWidth={MIN_CARD_WIDTH}
				overscan={6}
				renderItem={renderItem}
			/>
		</PageLayout.Content>
	)
}
