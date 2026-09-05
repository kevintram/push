import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { Plus } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

import { Button } from '~/components/ui'
import { iconSizes } from '~/styles/tokens.stylex'

import { ReviewComposer } from '../ReviewComposer'
import { CardReviewsPanel } from './CardReviewsPanel'

const styles = stylex.create({
	addReview: {
		flexShrink: 0,
		inlineSize: '100%',
	},
	composer: {
		marginInline: 0,
		flexShrink: 0,
		inlineSize: '100%',
	},
})

type CardSidebarReviewsProps = {
	cardId: Id<'cards'>
	isComposerOpen?: boolean
	onComposerOpenChange?: (open: boolean) => void
}

export function CardSidebarReviews({
	cardId,
	isComposerOpen,
	onComposerOpenChange,
}: CardSidebarReviewsProps) {
	const [localComposerOpen, setLocalComposerOpen] = useState(false)
	const composerOpen = isComposerOpen ?? localComposerOpen
	const setComposerOpen = onComposerOpenChange ?? setLocalComposerOpen
	const addReviewButtonRef = useRef<HTMLButtonElement>(null)
	const composerId = useId()
	const wasComposerOpen = useRef(composerOpen)
	useEffect(() => {
		if (wasComposerOpen.current && !composerOpen) {
			addReviewButtonRef.current?.focus()
		}
		wasComposerOpen.current = composerOpen
	}, [composerOpen])

	const closeComposer = () => {
		setComposerOpen(false)
	}

	return (
		<>
			<Button
				aria-controls={composerId}
				aria-expanded={composerOpen}
				aria-label='Add review'
				disabled={composerOpen}
				onClick={() => setComposerOpen(true)}
				ref={addReviewButtonRef}
				variant='primary'
				xstyle={styles.addReview}
			>
				<Plus aria-hidden='true' size={iconSizes.md} />
				Add Review
			</Button>
			{composerOpen && (
				<ReviewComposer
					autoFocusDescription
					id={composerId}
					onCancel={closeComposer}
					onSuccess={closeComposer}
					xstyle={styles.composer}
				/>
			)}
			<CardReviewsPanel cardId={cardId} />
		</>
	)
}
