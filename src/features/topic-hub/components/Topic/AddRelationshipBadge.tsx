import * as PopoverPrimitive from '@radix-ui/react-popover'
import { useInsertMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { CommandGroup, CommandList, Command as CommandPrimitive } from 'cmdk'
import { Plus } from 'lucide-react'
import { use, useCallback, useMemo, useState } from 'react'
import { AutoSizeInput } from '~/components/ui/AutoSizeInput'
import { Badge } from '~/components/ui/Badge'
import { Command, CommandEmpty, CommandItem } from '~/components/ui/Command'
import { Popover, PopoverContent } from '~/components/ui/Popover'
import { supabase } from '~/utils/supabase'
import { useCreateRelationship } from '../../hooks/useCreateRelationship'
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch'
import { TopicHubContext } from '../../stores/SelectedTopicContext'

export function AddRelationshipBadge({ type }: { type: 'child' | 'parent' }) {
	const [open, setOpen] = useState(false)
	const { selectedTopic, topics } = use(TopicHubContext)
	const createRelationship = useCreateRelationship()

	// topics excluding current and children
	const availableTopics = useMemo(
		() =>
			// TODO: also filter topics that would create a cycle
			Array.from(topics.values()).filter(
				t =>
					t.id !== selectedTopic?.id &&
					(type === 'child'
						? !selectedTopic?.children.some(child => child.id === t.id)
						: !selectedTopic?.parents.some(parent => parent.id === t.id))
			),
		[selectedTopic, topics, type]
	)

	const { searchTerm, setSearchTerm, filteredTopics } = useDebouncedSearch({
		topics: availableTopics,
		debounceMs: 300
	})
	const searchTrimmed = searchTerm.trim()
	const searchNotEmpty = searchTrimmed.length > 0

	const { mutateAsync: insertTopicMutation } = useInsertMutation(
		supabase.from('topics'),
		['id'],
		'*'
	)

	const addRelationshipWithExisting = useCallback(
		async (topicId: number) => {
			setOpen(false)

			if (type === 'child') {
				await createRelationship.mutateAsync({
					parent: selectedTopic!.id,
					child: topicId
				})
			} else {
				await createRelationship.mutateAsync({
					parent: topicId,
					child: selectedTopic!.id
				})
			}
		},
		[createRelationship, selectedTopic, type]
	)

	const addRelationshipWithNewTopic = useCallback(async () => {
		setOpen(false)
		const createdTopic = await insertTopicMutation([{ name: searchTrimmed }])

		if (!createdTopic?.[0]) {
			throw new Error('Failed to create topic')
		}

		if (type === 'child') {
			await createRelationship.mutateAsync({
				parent: selectedTopic!.id,
				child: createdTopic?.[0].id
			})
		} else {
			await createRelationship.mutateAsync({
				parent: createdTopic?.[0].id,
				child: selectedTopic!.id
			})
		}
	}, [
		insertTopicMutation,
		searchTrimmed,
		type,
		createRelationship.mutateAsync,
		selectedTopic
	])

	if (!open)
		return (
			<Badge
				className='cursor-pointer items-center border-dashed py-1 hover:bg-muted/50'
				onClick={() => setOpen(true)}
				variant='outline'
			>
				<Plus className='h-3 w-3' />
			</Badge>
		)

	return (
		<div className='flex items-center'>
			<Popover
				onOpenChange={(open: boolean) => {
					setOpen(open)
				}}
				open={open}
			>
				<Command shouldFilter={false}>
					<PopoverPrimitive.Anchor asChild={true}>
						<Badge
							className='flex cursor-text items-center border-dashed py-1 hover:bg-muted/50'
							variant='outline'
						>
							<CommandPrimitive.Input
								asChild={true}
								autoFocus={true}
								onFocus={() => setOpen(true)}
								onKeyDown={e => setOpen(e.key !== 'Escape')}
								onMouseDown={() =>
									setOpen(currentOpen => !!searchTerm || !currentOpen)
								}
								onValueChange={setSearchTerm}
								value={searchTerm}
							>
								<AutoSizeInput
									className='min-w-[24px] border-none bg-transparent text-xs focus:outline-none'
									onChange={e => setSearchTerm(e.target.value)}
									value={searchTerm}
								/>
							</CommandPrimitive.Input>
						</Badge>
					</PopoverPrimitive.Anchor>
					<PopoverContent
						align='start'
						asChild={true}
						className='w-[--radix-popover-trigger-width] p-2'
						onInteractOutside={e => {
							if (
								e.target instanceof Element &&
								e.target.hasAttribute('cmdk-input')
							) {
								e.preventDefault()
							}
						}}
						onOpenAutoFocus={e => e.preventDefault()}
						side='bottom'
					>
						<CommandList>
							<CommandEmpty>No topic found.</CommandEmpty>
							<CommandGroup />
							{filteredTopics.slice(0, searchNotEmpty ? 4 : 5).map(topic => (
								<CommandItem
									key={topic.id}
									onMouseDown={e => e.preventDefault()}
									onSelect={() => addRelationshipWithExisting(topic.id)}
									value={topic.name}
								>
									{topic.name}
								</CommandItem>
							))}
							{searchNotEmpty && (
								<CommandItem
									key={`create-${searchTrimmed}`}
									onMouseDown={e => e.preventDefault()}
									onSelect={addRelationshipWithNewTopic}
									value={searchTrimmed}
								>
									Create "{searchTrimmed}"
								</CommandItem>
							)}
						</CommandList>
					</PopoverContent>
				</Command>
			</Popover>
		</div>
	)
}
