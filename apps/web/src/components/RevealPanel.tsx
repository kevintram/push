import { Check, Copy } from 'lucide-react'
import { type KeyboardEvent, type MouseEvent, useEffect, useRef } from 'react'
import { ReviewModeHelperText } from '~/components/ReviewModeHelperText'
import { Button } from '~/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Textarea } from '~/components/ui/textarea'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/tooltip'
import { cn } from '~/lib/utils'

export type RevealPanelTab = 'guess' | 'reveal'

type RevealPanelProps = {
	value: RevealPanelTab
	onValueChange: (value: RevealPanelTab) => void
	guessValue: string
	onGuessValueChange: (value: string) => void
	onGuessCopy: () => void | Promise<void>
	revealValue: string
	onRevealCopy: () => void | Promise<void>
	revealReadOnly?: boolean
	onRevealValueChange?: (value: string) => void
	onRevealBlur?: () => void
	isCopied: boolean
	containerClassName?: string
	tabsClassName?: string
	headerClassName?: string
	contentClassName?: string
	guessFieldContainerClassName?: string
	revealFieldContainerClassName?: string
	textareaClassName?: string
	guessPlaceholder?: string
	revealPlaceholder?: string
	revealHelperVariant?: 'autosave' | null
	stopPropagation?: boolean
	autoFocusGuess?: boolean
}

export function RevealPanel({
	value,
	onValueChange,
	guessValue,
	onGuessValueChange,
	onGuessCopy,
	revealValue,
	onRevealCopy,
	revealReadOnly = false,
	onRevealValueChange,
	onRevealBlur,
	isCopied,
	containerClassName,
	tabsClassName,
	headerClassName,
	contentClassName = 'mt-0 flex min-h-0 flex-1 flex-col',
	guessFieldContainerClassName = 'relative min-h-0 flex-1',
	revealFieldContainerClassName = 'relative min-h-0 flex-1',
	textareaClassName,
	guessPlaceholder = 'Type your guess...',
	revealPlaceholder,
	revealHelperVariant = null,
	stopPropagation = false,
	autoFocusGuess = false
}: RevealPanelProps) {
	const guessTextareaRef = useRef<HTMLTextAreaElement | null>(null)

	const handleStopPropagation = (
		event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>
	) => {
		if (stopPropagation) {
			event.stopPropagation()
		}
	}
	const handleAction = (action: () => void | Promise<void>) => {
		const result = action()
		if (result instanceof Promise) {
			result.catch(() => {})
		}
	}

	const helperVariant = value === 'guess' ? 'guess' : revealHelperVariant
	const helperText = helperVariant ? (
		<ReviewModeHelperText
			className='min-w-0 flex-1 translate-y-1 self-end whitespace-nowrap text-right'
			variant={helperVariant}
		/>
	) : null
	const copyButtonClassName =
		'absolute top-2 right-2 text-muted-foreground hover:text-foreground'
	const resolvedTextareaClassName = cn(
		'min-h-24 resize-none border-border/70 bg-background/80 pr-8',
		textareaClassName
	)

	useEffect(() => {
		if (!autoFocusGuess || value !== 'guess') return

		const frameId = window.requestAnimationFrame(() => {
			const textarea = guessTextareaRef.current
			if (!textarea) return
			textarea.focus()
			const cursorPosition = textarea.value.length
			textarea.setSelectionRange(cursorPosition, cursorPosition)
		})

		return () => {
			window.cancelAnimationFrame(frameId)
		}
	}, [autoFocusGuess, value])

	return (
		<div className={containerClassName}>
			<Tabs
				className={cn('flex flex-col gap-2', tabsClassName)}
				onValueChange={value => onValueChange(value as RevealPanelTab)}
				value={value}
			>
				<div
					className={cn(
						'flex min-w-0 items-center justify-between gap-2',
						headerClassName
					)}
				>
					<TabsList
						className='h-8'
						onClick={handleStopPropagation}
						onKeyDown={handleStopPropagation}
						variant='default'
					>
						<TabsTrigger
							className='px-2 text-xs'
							onClick={handleStopPropagation}
							onKeyDown={handleStopPropagation}
							value='guess'
						>
							Guess
						</TabsTrigger>
						<TabsTrigger
							className='px-2 text-xs'
							onClick={handleStopPropagation}
							onKeyDown={handleStopPropagation}
							value='reveal'
						>
							Reveal
						</TabsTrigger>
					</TabsList>
					{helperText}
				</div>
				<TabsContent className={contentClassName} value='guess'>
					<div className={guessFieldContainerClassName}>
						<Textarea
							className={resolvedTextareaClassName}
							onChange={event => onGuessValueChange(event.target.value)}
							onClick={handleStopPropagation}
							onKeyDown={handleStopPropagation}
							placeholder={guessPlaceholder}
							ref={guessTextareaRef}
							spellCheck={false}
							value={guessValue}
						/>
						<Tooltip>
							<TooltipTrigger
								render={
									<Button
										aria-label='Copy guess text'
										className={copyButtonClassName}
										onClick={event => {
											handleStopPropagation(event)
											handleAction(onGuessCopy)
										}}
										size='icon-xs'
										type='button'
										variant='ghost'
									/>
								}
							>
								{isCopied ? (
									<Check className='h-3 w-3' />
								) : (
									<Copy className='h-3 w-3' />
								)}
							</TooltipTrigger>
							<TooltipContent>{isCopied ? 'Copied' : 'Copy'}</TooltipContent>
						</Tooltip>
					</div>
				</TabsContent>
				<TabsContent className={contentClassName} value='reveal'>
					<div className={revealFieldContainerClassName}>
						<Textarea
							className={resolvedTextareaClassName}
							onBlur={onRevealBlur}
							onChange={event => onRevealValueChange?.(event.target.value)}
							onClick={handleStopPropagation}
							onKeyDown={handleStopPropagation}
							placeholder={revealPlaceholder}
							readOnly={revealReadOnly}
							spellCheck={false}
							value={revealValue}
						/>
						<Button
							aria-label='Copy reveal text'
							className={copyButtonClassName}
							onClick={event => {
								handleStopPropagation(event)
								handleAction(onRevealCopy)
							}}
							size='icon-xs'
							type='button'
							variant='ghost'
						>
							{isCopied ? (
								<Check className='h-3 w-3' />
							) : (
								<Copy className='h-3 w-3' />
							)}
						</Button>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	)
}
