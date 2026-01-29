import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '~/components/ui/Button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/Dialog'

interface ConversionConfirmationDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onConfirm: () => void
	isPending: boolean
	targetEntityType: string
	entityName: string
	migrated: Array<{ label: string; count: number }>
	lost: Array<string>
	blockers: Array<string>
}

export function ConversionConfirmationDialog({
	open,
	onOpenChange,
	onConfirm,
	isPending,
	targetEntityType,
	entityName,
	migrated,
	lost,
	blockers
}: ConversionConfirmationDialogProps) {
	const isBlocked = blockers.length > 0
	const visibleMigrated = migrated.filter(item => item.count > 0)

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Convert to {targetEntityType}?</DialogTitle>
					<DialogDescription>
						'{entityName}' will become a {targetEntityType.toLowerCase()}.
					</DialogDescription>
				</DialogHeader>

				<div className='flex flex-col gap-3'>
					{visibleMigrated.length > 0 && (
						<div className='flex flex-col gap-1'>
							<span className='font-medium text-muted-foreground text-sm'>
								Will be migrated
							</span>
							<ul className='flex flex-col gap-1'>
								{visibleMigrated.map(item => (
									<li
										className='flex items-center gap-2 text-green-600 text-sm dark:text-green-400'
										key={item.label}
									>
										<CheckCircle2 className='h-4 w-4 shrink-0' />
										{item.label} ({item.count})
									</li>
								))}
							</ul>
						</div>
					)}

					{lost.length > 0 && (
						<div className='flex flex-col gap-1'>
							<span className='font-medium text-muted-foreground text-sm'>
								Will be lost
							</span>
							<ul className='flex flex-col gap-1'>
								{lost.map(item => (
									<li
										className='flex items-center gap-2 text-amber-600 text-sm dark:text-amber-400'
										key={item}
									>
										<AlertTriangle className='h-4 w-4 shrink-0' />
										{item}
									</li>
								))}
							</ul>
						</div>
					)}

					{isBlocked && (
						<div className='flex flex-col gap-1'>
							<span className='font-medium text-muted-foreground text-sm'>
								Cannot convert
							</span>
							<ul className='flex flex-col gap-1'>
								{blockers.map(item => (
									<li
										className='flex items-center gap-2 text-red-600 text-sm dark:text-red-400'
										key={item}
									>
										<XCircle className='h-4 w-4 shrink-0' />
										{item}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button onClick={() => onOpenChange(false)} variant='outline'>
						Cancel
					</Button>
					<Button disabled={isBlocked || isPending} onClick={onConfirm}>
						{isPending ? 'Converting...' : 'Convert'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
