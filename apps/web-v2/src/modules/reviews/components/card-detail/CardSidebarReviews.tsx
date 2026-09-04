import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { Plus, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'

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
}

export function CardSidebarReviews({ cardId }: CardSidebarReviewsProps) {
	const [isComposerOpen, setIsComposerOpen] = useState(false)
	const addReviewButtonRef = useRef<HTMLButtonElement>(null)
	const composerId = useId()

	const closeComposer = () => {
		setIsComposerOpen(false)
		addReviewButtonRef.current?.focus()
	}

	return (
		<>
			<Button
				aria-controls={composerId}
				aria-expanded={isComposerOpen}
				aria-label={
					isComposerOpen ? 'Close review composer' : 'Add review'
				}
				onClick={() => {
					if (isComposerOpen) {
						closeComposer()
					} else {
						setIsComposerOpen(true)
					}
				}}
				ref={addReviewButtonRef}
				variant='primary'
				xstyle={styles.addReview}
			>
				{isComposerOpen ? (
					<X aria-hidden='true' size={iconSizes.md} />
				) : (
					<Plus aria-hidden='true' size={iconSizes.md} />
				)}
				{isComposerOpen ? 'Close' : 'Add Review'}
			</Button>
			{isComposerOpen && (
				<ReviewComposer
					autoFocusDescription
					cardId={cardId}
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
