import { SquarePen } from 'lucide-react'
import { Button } from '~/components/ui/Button'
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger
} from '~/components/ui/HoverCard'

interface CreateTopicButtonProps {
	disabled?: boolean
	onClick: () => void
	showHoverCard?: boolean
	buttonText?: string
}
// Button for creating a topic meant to be used in empty state
export function EmptyStateCreateTopicButton({
	disabled,
	onClick,
	showHoverCard = true,
	buttonText = 'Create a topic'
}: CreateTopicButtonProps) {
	const button = (
		<Button disabled={disabled} onClick={onClick} variant='default'>
			<SquarePen />
			{buttonText}
		</Button>
	)

	if (!showHoverCard) {
		return button
	}

	return (
		<HoverCard openDelay={300}>
			<HoverCardTrigger render={button} />
			<HoverCardContent className='text-center'>
				<p className='font-medium text-sm'>
					Topics are anything you want to learn or remember.
				</p>
			</HoverCardContent>
		</HoverCard>
	)
}
