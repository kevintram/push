import { AlertTriangle } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import { openSettingsDialog } from '~/components/settings-events'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { useReviewMode } from '~/stores/ReviewModeContext'

export function DueReviewModePrompt() {
	const {
		reviewMode,
		setReviewMode,
		showReviewModeWarning,
		setShowReviewModeWarning,
		autoEnableReviewMode,
		setAutoEnableReviewMode,
	} = useReviewMode()
	const checkboxId = useId()
	const [neverShowAgain, setNeverShowAgain] = useState(false)
	const [dismissed, setDismissed] = useState(false)
	const autoEnabledThisVisit = useRef(false)
	const hasBeenEnabled = useRef(reviewMode !== 'off')

	useEffect(() => {
		if (reviewMode !== 'off') {
			hasBeenEnabled.current = true
		}
	}, [reviewMode])

	useEffect(() => {
		if (
			reviewMode !== 'off' ||
			!autoEnableReviewMode ||
			autoEnabledThisVisit.current
		) {
			return
		}

		autoEnabledThisVisit.current = true
		hasBeenEnabled.current = true
		setReviewMode('on')
		toast('Review mode has been turned on', {
			action: {
				label: 'Turn off',
				onClick: () => setReviewMode('off'),
			},
			cancel: {
				label: 'Open settings',
				onClick: openSettingsDialog,
			},
		})
	}, [autoEnableReviewMode, reviewMode, setReviewMode])

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

	function handleTurnOn() {
		handleClose()
		setReviewMode('on')
	}

	function handleAlwaysTurnOn() {
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
						<AlertTriangle className='size-5' />
					</AlertDialogMedia>
					<AlertDialogTitle>Review mode is off</AlertDialogTitle>
					<AlertDialogDescription>
						Turn on review mode to hide answers while you work
						through due cards.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className='flex items-center gap-2'>
					<Checkbox
						checked={neverShowAgain}
						id={checkboxId}
						onCheckedChange={setNeverShowAgain}
					/>
					<label
						className='cursor-pointer text-sm'
						htmlFor={checkboxId}
					>
						Never show this again
					</label>
				</div>
				<AlertDialogFooter className='flex-col gap-2 sm:flex-col'>
					<Button
						className='w-full'
						onClick={handleTurnOn}
						variant='outline'
					>
						Turn on
					</Button>
					<Button
						className='w-full'
						onClick={handleAlwaysTurnOn}
						variant='outline'
					>
						Always turn on
					</Button>
					<Button
						className='w-full'
						onClick={handleClose}
						variant='ghost'
					>
						Dismiss
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
