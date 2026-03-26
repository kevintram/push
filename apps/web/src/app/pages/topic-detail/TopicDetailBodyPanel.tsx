import type { Dispatch, SetStateAction } from 'react'

import { RevealPanel, type RevealPanelTab } from '~/components/RevealPanel'
import { Badge } from '~/components/ui/badge'
import { Textarea } from '~/components/ui/textarea'
import { EMPTY_BADGE_CLASSNAME } from './shared'

export function TopicDetailBodyPanel({
	body,
	flushBody,
	guessBodyText,
	handleCopyGuessText,
	handleCopyRevealText,
	hidesSecondary,
	isBodyEmpty,
	isRevealPanelCopied,
	onBodyChange,
	revealPanelTab,
	setBody,
	setGuessBodyText,
	setRevealPanelTab
}: {
	body: string
	flushBody: () => void
	guessBodyText: string
	handleCopyGuessText: () => Promise<void>
	handleCopyRevealText: (textOverride?: string) => Promise<void>
	hidesSecondary: boolean
	isBodyEmpty: boolean
	isRevealPanelCopied: boolean
	onBodyChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
	revealPanelTab: RevealPanelTab | null
	setBody: (value: string) => void
	setGuessBodyText: Dispatch<SetStateAction<string>>
	setRevealPanelTab: Dispatch<SetStateAction<RevealPanelTab | null>>
}) {
	if (hidesSecondary) {
		return (
			<RevealPanel
				className='mt-0'
				closedContent={
					isBodyEmpty ? (
						<Badge
							className={`${EMPTY_BADGE_CLASSNAME} pointer-events-none absolute top-2 right-2`}
							variant='outline'
						>
							Empty
						</Badge>
					) : null
				}
				guessValue={guessBodyText}
				isCopied={isRevealPanelCopied}
				onGuessCopy={handleCopyGuessText}
				onGuessValueChange={setGuessBodyText}
				onRevealBlur={flushBody}
				onRevealCopy={handleCopyRevealText}
				onRevealValueChange={setBody}
				onValueChange={setRevealPanelTab}
				revealHelperVariant='autosave'
				revealPlaceholder='Write your topic...'
				revealValue={body}
				value={revealPanelTab}
				variant='detail'
			/>
		)
	}

	return (
		<Textarea
			className='!bg-transparent m-0 min-h-[2lh] resize-none overflow-hidden break-words rounded-none border-none p-0 text-base leading-relaxed shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
			onBlur={flushBody}
			onChange={onBodyChange}
			placeholder='Write your topic...'
			spellCheck={false}
			value={body}
		/>
	)
}
