import * as PopoverPrimitive from '@radix-ui/react-popover'
import { useInsertMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { CommandGroup, CommandList, Command as CommandPrimitive } from 'cmdk'
import { Plus } from 'lucide-react'
import { use, useCallback, useState } from 'react'
import { AutoSizeInput } from '~/components/ui/AutoSizeInput'
import { Badge } from '~/components/ui/Badge'
import { Command, CommandEmpty, CommandItem } from '~/components/ui/Command'
import { Popover, PopoverContent } from '~/components/ui/Popover'
import { useGetPotentialChildren } from '~/features/topic-hub/hooks/useGetPotentialChildren'
import { useGetPotentialParents } from '~/features/topic-hub/hooks/useGetPotentialParents'
import { supabase } from '~/utils/supabase'
import { useCreateRelationship } from '../../../hooks/useCreateRelationship'
import { useDebouncedSearch } from '../../../hooks/useDebouncedSearch'
import { TopicHubContext } from '../../../stores/SelectedTopicContext'

export function AddRelationshipBadge({ type }: { type: 'child' | 'parent' }) {
	const [open, setOpen] = useState(false)
	const { selectedTopic } = use(TopicHubContext)

	const { data: potentialParents } = useGetPotentialParents(selectedTopic?.id, {
		enabled: selectedTopic !== undefined && type === 'parent'
	})

	const { data: potentialChildren } = useGetPotentialChildren(
		selectedTopic?.id,
		{
			enabled: selectedTopic !== undefined && type === 'child'
		}
	)

	const {
		query: topicToAdd,
		setQuery: setTopicToAdd,
		results: suggestedTopics
	} = useDebouncedSearch({
		topics: potentialParents || potentialChildren || [],
		debounceMs: 300
	})
	const topicToAddTrimmed = topicToAdd.trim()
	const topicToAddEmpty = topicToAddTrimmed.length > 0

	const createRelationship = useCreateRelationship(() => {
		setTopicToAdd('') // reset on success
	})

	const { mutateAsync: insertTopicMutation } = useInsertMutation(
		supabase.from('topics'),
		['id'],
		'*'
	)

	const addRelationshipWithExisting = useCallback(
		async (topicId: number) => {
			if (!selectedTopic) return
			setOpen(false)

			if (type === 'child') {
				await createRelationship.mutateAsync({
					parent: selectedTopic.id,
					child: topicId
				})
			} else {
				await createRelationship.mutateAsync({
					parent: topicId,
					child: selectedTopic.id
				})
			}
		},
		[createRelationship, selectedTopic, type]
	)

	const addRelationshipWithNewTopic = useCallback(async () => {
		if (!selectedTopic) return

		setOpen(false)
		const createdTopic = await insertTopicMutation([
			{ name: topicToAddTrimmed }
		])

		if (!createdTopic?.[0]) {
			throw new Error('Failed to create topic')
		}

		if (type === 'child') {
			await createRelationship.mutateAsync({
				parent: selectedTopic.id,
				child: createdTopic?.[0].id
			})
		} else {
			await createRelationship.mutateAsync({
				parent: createdTopic?.[0].id,
				child: selectedTopic.id
			})
		}
	}, [
		insertTopicMutation,
		topicToAddTrimmed,
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
				onOpenChange={(_open: boolean) => {
					setOpen(_open)
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
									setOpen(currentOpen => !!topicToAdd || !currentOpen)
								}
								onValueChange={setTopicToAdd}
								value={topicToAdd}
							>
								<AutoSizeInput
									className='min-w-[24px] border-none bg-transparent text-xs focus:outline-none'
									onChange={e => setTopicToAdd(e.target.value)}
									value={topicToAdd}
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
							{suggestedTopics.slice(0, topicToAddEmpty ? 4 : 5).map(topic => (
								<CommandItem
									key={topic.id}
									onMouseDown={e => e.preventDefault()}
									onSelect={() => addRelationshipWithExisting(topic.id)}
									value={topic.name}
								>
									{topic.name}
								</CommandItem>
							))}
							{topicToAddEmpty && (
								<CommandItem
									key={`create-${topicToAddTrimmed}`}
									onMouseDown={e => e.preventDefault()}
									onSelect={addRelationshipWithNewTopic}
									value={topicToAddTrimmed}
								>
									Create "{topicToAddTrimmed}"
								</CommandItem>
							)}
						</CommandList>
					</PopoverContent>
				</Command>
			</Popover>
		</div>
	)
}
