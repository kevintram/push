import { ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { useFlashcardMode } from '~/stores/FlashcardModeContext'

export function ReviewModeWarningDialog() {
	const {
		reviewMode,
		setReviewMode,
		showReviewModeWarning,
		setShowReviewModeWarning
	} = useFlashcardMode()
	const checkboxId = useId()
	const [neverShowAgain, setNeverShowAgain] = useState(false)
	const [dismissed, setDismissed] = useState(false)

	const isOpen = reviewMode === 'off' && showReviewModeWarning && !dismissed

	function handleClose() {
		if (neverShowAgain) {
			setShowReviewModeWarning(false)
		}
		setDismissed(true)
	}

	function handleSetMode(mode: 'hide_answers_only' | 'hide_everything') {
		handleClose()
		setReviewMode(mode)
	}

	return (
		<Dialog
			onOpenChange={open => {
				if (!open) handleClose()
			}}
			open={isOpen}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Review mode is not on</DialogTitle>
					<DialogDescription>
						Review mode allows you to hide stuff so you can guess stuff
					</DialogDescription>
				</DialogHeader>
				<div className='flex items-center gap-2'>
					<Checkbox
						checked={neverShowAgain}
						id={checkboxId}
						onCheckedChange={setNeverShowAgain}
					/>
					<label className='cursor-pointer text-sm' htmlFor={checkboxId}>
						Never show this again
					</label>
				</div>
				<DialogFooter>
					<DialogClose render={<Button variant='outline' />}>
						Dismiss
					</DialogClose>
					<DropdownMenu>
						<DropdownMenuTrigger render={<Button />}>
							Activate
							<ChevronDown className='h-4 w-4' />
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuItem
								onClick={() => handleSetMode('hide_answers_only')}
							>
								<div>
									<div>Answers</div>
									<div className='text-muted-foreground text-xs'>
										Hide answers only
									</div>
								</div>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => handleSetMode('hide_everything')}
							>
								<div>
									<div>All</div>
									<div className='text-muted-foreground text-xs'>
										Hide everything
									</div>
								</div>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
