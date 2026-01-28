import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Dumbbell, Loader2, Plus, Search } from 'lucide-react'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { LearnablePanel } from '~/components/LearnablePanel'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { PracticeActionMenu } from '~/features/practices/components/PracticeActionMenu'
import { PracticeCard } from '~/features/practices/components/PracticeCard'
import type { Practice } from '~/features/practices/types/practice.types'
import { useAddTopicPractice } from '../api/addTopicPractice'
import { topicKeys } from '../api/queryKeys'
import { useRemoveTopicPractice } from '../api/removeTopicPractice'
import { AddPracticeToTopicDialog } from './AddPracticeToTopicDialog'

const MIN_HEIGHT = 96

interface TopicPracticesPanelProps {
	topicId: number | undefined
	/**
	 * Practices from the single getTopic fetch.
	 * When provided, the panel uses this directly instead of making a separate API call.
	 */
	practices?: Array<Practice>
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
	/**
	 * Called when a practice is selected/clicked.
	 */
	onPracticeSelect?: (practiceId: number) => void
	/**
	 * Custom card renderer. If not provided, uses default PracticeCard.
	 * @param practice - The practice to render
	 * @param onRemove - Callback to remove the relationship
	 * @param onClick - Callback when the card is clicked
	 */
	renderCard?: (
		practice: Practice,
		onRemove: () => void,
		onClick: () => void
	) => ReactNode
}

export function TopicPracticesPanel({
	topicId,
	practices: practicesProp,
	getScrollElement,
	scrollMargin,
	onPracticeSelect,
	renderCard
}: TopicPracticesPanelProps) {
	const queryClient = useQueryClient()
	const [showSearchDialog, setShowSearchDialog] = useState(false)

	// Use prop directly - practices comes from the single getTopic fetch
	const practices = practicesProp ?? []

	const addTopicPractice = useAddTopicPractice()
	const removeTopicPractice = useRemoveTopicPractice()

	const isAdding = addTopicPractice.isPending

	const handleAdd = useCallback(
		async (practice: Practice) => {
			if (!topicId) return

			await addTopicPractice.mutateAsync({
				topicId,
				practiceId: practice.id
			})
		},
		[topicId, addTopicPractice]
	)

	const handlePracticeUpdateSuccess = useCallback(
		(updatedPractice: Practice) => {
			queryClient.setQueryData(
				topicKeys.detail(topicId!),
				(old: { practices?: Array<Practice> } | undefined) => {
					if (!old) return old
					return {
						...old,
						practices:
							old.practices?.map(practice =>
								practice.id === updatedPractice.id ? updatedPractice : practice
							) ?? []
					}
				}
			)
		},
		[queryClient, topicId]
	)

	const existingPracticeIds = useMemo(
		() => practices.map(p => p.id),
		[practices]
	)

	const estimateItemSize = useCallback((practice: Practice) => {
		const baseHeight = 80
		const lineHeight = 10
		const numCharsPerLine = 30
		const newLine = 10

		const promptHeight =
			Math.floor((practice.prompt?.length ?? 0) / numCharsPerLine) * lineHeight
		const answerHeight =
			Math.floor((practice.answer?.length ?? 0) / numCharsPerLine) * lineHeight

		return baseHeight + promptHeight + newLine + answerHeight
	}, [])

	const renderItem = useCallback(
		(practice: Practice) => {
			const handleRemoveRelationship = () => {
				if (!topicId) return
				removeTopicPractice.mutate({
					topicId,
					practiceId: practice.id
				})
			}

			const handleClick = () => {
				onPracticeSelect?.(practice.id)
			}

			// Use custom renderer if provided
			if (renderCard) {
				return renderCard(practice, handleRemoveRelationship, handleClick)
			}

			// Default card rendering
			return (
				<PracticeCard
					headerRight={
						<PracticeActionMenu
							onPracticeUpdateSuccess={handlePracticeUpdateSuccess}
							onRemoveRelationship={handleRemoveRelationship}
							practice={practice}
							removeRelationshipText='Remove from Topic'
						/>
					}
					minHeight={MIN_HEIGHT}
					onPracticeClick={handleClick}
					practice={practice}
				/>
			)
		},
		[
			onPracticeSelect,
			renderCard,
			handlePracticeUpdateSuccess,
			topicId,
			removeTopicPractice
		]
	)

	const getItemKey = useCallback((practice: Practice) => practice.id, [])

	const actions = topicId ? (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild={true} disabled={isAdding}>
					<Button className='gap-1' size='sm' variant='secondary'>
						{isAdding ? (
							<Loader2 className='h-4 w-4 animate-spin' />
						) : (
							<Plus className='h-4 w-4' />
						)}
						Add
						<ChevronDown className='h-4 w-4' />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='start'>
					<DropdownMenuItem onClick={() => setShowSearchDialog(true)}>
						<Search className='h-4 w-4' />
						Search Practices
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AddPracticeToTopicDialog
				existingPracticeIds={existingPracticeIds}
				onOpenChange={setShowSearchDialog}
				onSelected={handleAdd}
				open={showSearchDialog}
			/>
		</>
	) : undefined

	return (
		<LearnablePanel
			actions={actions}
			estimateItemSize={estimateItemSize}
			getItemKey={getItemKey}
			getScrollElement={getScrollElement}
			hideWhenEmpty={false}
			icon={Dumbbell}
			items={practices}
			label='Practices'
			renderItem={renderItem}
			scrollMargin={scrollMargin}
		/>
	)
}
