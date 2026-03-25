import { Check, Copy } from 'lucide-react'
import {
	type KeyboardEvent,
	type MouseEvent,
	type ReactNode,
	useEffect,
	useRef,
	useState
} from 'react'
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
	value: RevealPanelTab | null
	onValueChange: (value: RevealPanelTab) => void
	guessValue: string
	onGuessValueChange: (value: string) => void
	onGuessCopy: () => void | Promise<void>
	revealValue: string
	onRevealCopy: (value: string) => void | Promise<void>
	onRevealValueChange?: (value: string) => void
	onRevealBlur?: () => void
	isCopied: boolean
	variant: 'card' | 'detail'
	className?: string
	guessPlaceholder?: string
	revealPlaceholder?: string
	revealHelperVariant?: 'autosave' | null
	closedContent?: ReactNode
	stopPropagation?: boolean
	autoFocusGuess?: boolean
}

const VARIANT_STYLES = {
	card: {
		wrapper:
			'mt-1 flex min-h-16 flex-1 flex-col rounded-xl border border-muted-foreground/40 border-dashed bg-muted/40 p-2',
		tabs: 'flex min-h-0 flex-1 flex-col gap-2',
		content: 'mt-0 flex min-h-0 flex-1 flex-col',
		fieldContainer: 'relative flex min-h-0 flex-1 flex-col',
		textarea: 'field-sizing-fixed h-full min-h-24 flex-1 text-sm',
		closed: 'flex min-h-0 flex-1 items-center justify-center'
	},
	detail: {
		wrapper:
			'mt-1 flex min-h-0 flex-1 flex-col rounded-xl border border-muted-foreground/40 border-dashed bg-muted/40 p-2',
		tabs: 'flex min-h-0 flex-1 flex-col gap-2',
		content: 'mt-0 flex min-h-0 flex-1 flex-col',
		fieldContainer: 'relative flex min-h-0 flex-1 flex-col',
		textarea: 'min-h-24 flex-1',
		closed: 'flex min-h-0 flex-1 w-full items-center justify-center'
	}
} as const

export function RevealPanel({
	value,
	onValueChange,
	guessValue,
	onGuessValueChange,
	onGuessCopy,
	revealValue,
	onRevealCopy,
	onRevealValueChange,
	onRevealBlur,
	isCopied,
	variant,
	className,
	guessPlaceholder = 'Type your guess...',
	revealPlaceholder,
	revealHelperVariant = null,
	closedContent,
	stopPropagation = false,
	autoFocusGuess = false
}: RevealPanelProps) {
	const guessTextareaRef = useRef<HTMLTextAreaElement | null>(null)
	const [localRevealValue, setLocalRevealValue] = useState(revealValue)
	const variantStyles = VARIANT_STYLES[variant]
	const resolvedRevealValue =
		onRevealValueChange == null ? localRevealValue : revealValue

	useEffect(() => {
		if (onRevealValueChange != null) return
		setLocalRevealValue(revealValue)
	}, [onRevealValueChange, revealValue])

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
		variantStyles.textarea
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

	if (value == null) {
		return (
			<div className={cn('relative', variantStyles.wrapper, className)}>
				<div className={variantStyles.closed}>
					<div className='flex items-center gap-2'>
						<Button
							className='rounded-full'
							onClick={event => {
								handleStopPropagation(event)
								onValueChange('guess')
							}}
							onKeyDown={handleStopPropagation}
							size='sm'
							type='button'
							variant='outline'
						>
							Type a guess
						</Button>
						<Button
							className='rounded-full'
							onClick={event => {
								handleStopPropagation(event)
								onValueChange('reveal')
							}}
							onKeyDown={handleStopPropagation}
							size='sm'
							type='button'
							variant='outline'
						>
							Reveal
						</Button>
					</div>
				</div>
				{closedContent}
			</div>
		)
	}

	return (
		<div className={cn('relative', variantStyles.wrapper, className)}>
			<Tabs
				className={variantStyles.tabs}
				onValueChange={value => onValueChange(value as RevealPanelTab)}
				value={value}
			>
				<div className='flex min-w-0 items-center justify-between gap-2'>
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
				<TabsContent className={variantStyles.content} value='guess'>
					<div className={variantStyles.fieldContainer}>
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
				<TabsContent className={variantStyles.content} value='reveal'>
					<div className={variantStyles.fieldContainer}>
						<Textarea
							className={resolvedTextareaClassName}
							onBlur={onRevealBlur}
							onChange={event => {
								const nextValue = event.target.value
								if (onRevealValueChange != null) {
									onRevealValueChange(nextValue)
									return
								}
								setLocalRevealValue(nextValue)
							}}
							onClick={handleStopPropagation}
							onKeyDown={handleStopPropagation}
							placeholder={revealPlaceholder}
							spellCheck={false}
							value={resolvedRevealValue}
						/>
						<Button
							aria-label='Copy reveal text'
							className={copyButtonClassName}
							onClick={event => {
								handleStopPropagation(event)
								handleAction(() => onRevealCopy(resolvedRevealValue))
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
