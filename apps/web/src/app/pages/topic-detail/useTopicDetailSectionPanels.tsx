import { type ChangeEvent, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useRevealPanel } from '~/hooks/useRevealPanel'
import { useCreateReviewCard } from '~/modules/review-cards/api/createReviewCard'
import { requestFocusNewReviewCardPrimaryText } from '~/modules/review-cards/createReviewCardIntent'
import type {
	ReviewCard as ReviewCardModel,
	ReviewCardType
} from '~/modules/review-cards/types/review-card.types'
import { useUpdateTopic } from '~/modules/topics/api/updateTopic'
import { useReviewMode } from '~/stores/ReviewModeContext'
import type {
	TopicDetailReviewCardControlsVariant,
	TopicDetailReviewCardFilter
} from './shared'
import { TopicDetailBodyEditor } from './TopicDetailBodyEditor'
import { TopicDetailReviewCardsSection } from './TopicDetailReviewCardsSection'
import type { TopicDetailSectionNode } from './topicDetailStructure'

type UseTopicDetailSectionPanelsOptions = {
	getScrollElement: () => HTMLDivElement | null
	onFilterChange: (filter: TopicDetailReviewCardFilter) => void
	onOpenReviewCard: (reviewCardId: number) => void
	onTopicInteraction?: () => void
	reviewCardControlsVariant: TopicDetailReviewCardControlsVariant
	resolvedSectionFilter: TopicDetailReviewCardFilter
	section: TopicDetailSectionNode
	sectionLabel: string
	isReviewCardsLoading: boolean
	topicReviewCardsById: Map<number, Array<ReviewCardModel>>
}

function filterReviewCards(
	reviewCards: Array<ReviewCardModel>,
	filter: TopicDetailReviewCardFilter
) {
	if (filter === 'all') return reviewCards

	return reviewCards.filter(reviewCard => reviewCard.type === filter)
}

export function useTopicDetailSectionPanels({
	getScrollElement,
	onFilterChange,
	onOpenReviewCard,
	onTopicInteraction,
	reviewCardControlsVariant,
	resolvedSectionFilter,
	section,
	sectionLabel,
	isReviewCardsLoading,
	topicReviewCardsById
}: UseTopicDetailSectionPanelsOptions) {
	const { mutateAsync: updateTopicAsync } = useUpdateTopic()
	const {
		mutateAsync: createReviewCardAsync,
		isPending: isCreatingReviewCard
	} = useCreateReviewCard()
	const { hidesSecondary } = useReviewMode()
	const sectionReviewCards = topicReviewCardsById.get(section.topic.id) ?? []
	const filteredReviewCards = useMemo(
		() => filterReviewCards(sectionReviewCards, resolvedSectionFilter),
		[resolvedSectionFilter, sectionReviewCards]
	)
	const hasReviewCards = sectionReviewCards.length > 0

	const saveTopicBody = useCallback(
		async (body: string) => {
			if (body === section.topic.body) return

			try {
				await updateTopicAsync({ id: section.topic.id, body })
			} catch {
				toast.error('Failed to update topic')
			}
		},
		[section.topic.body, section.topic.id, updateTopicAsync]
	)

	const {
		value: body,
		onChange: onBodyChange,
		setValue: setBody,
		flush: flushBody
	} = useAutoSave({
		initialValue: section.topic.body,
		onSave: saveTopicBody,
		key: `topic-document-body-${section.topic.id}`
	})
	const isBodyEmpty = body.trim().length === 0
	const {
		revealPanelTab,
		setRevealPanelTab,
		guessText: guessBodyText,
		setGuessText: setGuessBodyText,
		isCopied: isRevealPanelCopied,
		handleCopyGuessText,
		handleCopyRevealText
	} = useRevealPanel({
		revealText: body,
		entityId: section.topic.id,
		hidesSecondary,
		defaultTab: hidesSecondary ? null : 'reveal'
	})

	const handleAddReviewCard = async (type: ReviewCardType) => {
		try {
			const created = await createReviewCardAsync({
				topic_id: section.topic.id,
				type,
				primary_text: '',
				secondary_text: '',
				retired: false
			})
			onTopicInteraction?.()
			requestFocusNewReviewCardPrimaryText(created.id)
			onOpenReviewCard(created.id)
		} catch {
			toast.error('Failed to create review card')
		}
	}

	const handleBodyChange = useCallback(
		(event: ChangeEvent<HTMLTextAreaElement>) => {
			onTopicInteraction?.()
			onBodyChange(event)
		},
		[onBodyChange, onTopicInteraction]
	)

	const handleBodyValueChange = useCallback(
		(value: string) => {
			onTopicInteraction?.()
			setBody(value)
		},
		[onTopicInteraction, setBody]
	)

	const bodyPanel = (
		<TopicDetailBodyEditor
			body={body}
			flushBody={flushBody}
			guessBodyText={guessBodyText}
			handleCopyGuessText={handleCopyGuessText}
			handleCopyRevealText={handleCopyRevealText}
			hidesSecondary={hidesSecondary}
			isBodyEmpty={isBodyEmpty}
			isRevealPanelCopied={isRevealPanelCopied}
			onBodyChange={handleBodyChange}
			revealPanelTab={revealPanelTab}
			setBody={handleBodyValueChange}
			setGuessBodyText={setGuessBodyText}
			setRevealPanelTab={setRevealPanelTab}
		/>
	)

	const reviewCardsSection = (
		<TopicDetailReviewCardsSection
			filteredReviewCards={filteredReviewCards}
			getScrollElement={getScrollElement}
			hasReviewCards={hasReviewCards}
			hidesSecondary={hidesSecondary}
			isCreatingReviewCard={isCreatingReviewCard}
			isReviewCardsLoading={isReviewCardsLoading}
			onAddReviewCard={type => {
				handleAddReviewCard(type).catch(() => {})
			}}
			onFilterChange={onFilterChange}
			onOpenReviewCard={onOpenReviewCard}
			resolvedSectionFilter={resolvedSectionFilter}
			reviewCardControlsVariant={reviewCardControlsVariant}
			sectionLabel={sectionLabel}
		/>
	)

	return {
		bodyPanel,
		reviewCardsSection
	}
}
