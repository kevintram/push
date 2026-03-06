import { AlertTriangle } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
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
		<AlertDialog
			onOpenChange={open => {
				if (!open) handleClose()
			}}
			open={isOpen}
		>
			<AlertDialogContent size='sm'>
				<AlertDialogHeader>
					<AlertDialogMedia>
						<AlertTriangle className='h-5 w-5' />
					</AlertDialogMedia>
					<AlertDialogTitle>Review mode is not on!</AlertDialogTitle>
					<AlertDialogDescription>
						Review mode allows you to hide stuff so you can guess stuff
					</AlertDialogDescription>
				</AlertDialogHeader>
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
				<AlertDialogFooter className='flex-col gap-2 sm:flex-col'>
					<Button className='w-full' onClick={handleSetMode} variant='outline'>
						Turn on
					</Button>
					<Button
						className='w-full'
						onClick={handleAutoEnable}
						variant='outline'
					>
						Always turn on
					</Button>
					<Button className='w-full' onClick={handleClose} variant='ghost'>
						Dismiss
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
