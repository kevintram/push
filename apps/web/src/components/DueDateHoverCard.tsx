import dayjs from 'dayjs'
import { Calendar } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger
} from '~/components/ui/HoverCard'
import { getDueDateColorClass, getDueDateDisplay } from '~/utils/dueDate'

interface DueDateHoverCardProps {
    due: string | null
    srsEnabled: boolean
    className?: string
    children?: ReactNode
}

export function DueDateHoverCard({
    due,
    srsEnabled,
    className,
    children
}: DueDateHoverCardProps) {
    const dueDateDisplay = useMemo(() => getDueDateDisplay(due), [due])

    const colorClass = useMemo(
        () => getDueDateColorClass(dueDateDisplay?.displayText ?? null, srsEnabled),
        [dueDateDisplay?.displayText, srsEnabled]
    )

    const defaultTrigger = (
        <div className={`flex items-center gap-1 ${className ?? ''}`}>
            <Calendar className={`h-3 w-3 ${colorClass}`} />
            <span className={colorClass}>
                {dueDateDisplay ? dueDateDisplay.displayText : 'None'}
            </span>
        </div>
    )

    return (
        <HoverCard openDelay={300}>
            <HoverCardTrigger asChild={true}>
                {children ?? defaultTrigger}
            </HoverCardTrigger>
            <HoverCardContent className='w-auto p-3' side='bottom'>
                <div className='flex flex-col gap-1'>
                    <div className='font-semibold text-sm'>
                        {dueDateDisplay
                            ? `Due on ${dayjs(dueDateDisplay.dueDate).format('MMMM D, YYYY')}`
                            : 'No due date set'}
                    </div>
                    <p className='text-muted-foreground text-xs'>
                        {srsEnabled ? 'SRS Enabled' : 'SRS Disabled'}
                    </p>
                </div>
            </HoverCardContent>
        </HoverCard>
    )
}

