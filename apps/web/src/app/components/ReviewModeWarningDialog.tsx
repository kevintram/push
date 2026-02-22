import { useEffect, useId, useRef, useState } from 'react'
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
import { useFlashcardMode } from '~/stores/FlashcardModeContext'

export function ReviewModeWarningDialog() {
	const {
		reviewMode,
		setReviewMode,
		showReviewModeWarning,
		setShowReviewModeWarning,
		autoEnableReviewMode,
		setAutoEnableReviewMode
	} = useFlashcardMode()
	const checkboxId = useId()
	const [neverShowAgain, setNeverShowAgain] = useState(false)
	const [dismissed, setDismissed] = useState(false)

	// Track whether review mode was ever enabled during this component's
	// lifecycle. If the user explicitly turns it off after having it on,
	// we suppress the warning — it should only appear on page navigation.
	const hasBeenEnabled = useRef(false)
	useEffect(() => {
		if (reviewMode !== 'off') {
			hasBeenEnabled.current = true
		}
	}, [reviewMode])

	useEffect(() => {
		if (reviewMode === 'off' && autoEnableReviewMode) {
			setReviewMode('on')
		}
	}, [reviewMode, autoEnableReviewMode, setReviewMode])

	const isOpen =
		reviewMode === 'off' &&
		showReviewModeWarning &&
		!dismissed &&
		!autoEnableReviewMode &&
		!hasBeenEnabled.current

	function handleClose() {
		if (neverShowAgain) {
			setShowReviewModeWarning(false)
		}
		setDismissed(true)
	}

	function handleSetMode() {
		handleClose()
		setReviewMode('on')
	}

	function handleAutoEnable() {
		setAutoEnableReviewMode(true)
		handleClose()
		setReviewMode('on')
	}

	return (
		<Dialog
			onOpenChange={open => {
				if (!open) handleClose()
			}}
			open={isOpen}
		>
			<DialogContent className='max-w-sm'>
				<DialogHeader>
					<DialogTitle>Review mode is not on!</DialogTitle>
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
				<DialogFooter className='flex-col gap-2 sm:flex-col'>
					<Button className='w-full' onClick={handleSetMode} variant='outline'>
						Turn on
					</Button>
					<Button
						className='w-full'
						onClick={handleAutoEnable}
						variant='outline'
					>
						Turn on automatically
					</Button>
					<DialogClose render={<Button className='w-full' variant='ghost' />}>
						Dismiss
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
