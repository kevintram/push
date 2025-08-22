import React from 'react'
import { cn } from '~/lib/utils'

interface SegmentedControlProps {
	value?: string
	onValueChange?: (value: string) => void
	className?: string
	children: React.ReactNode
	allActive?: boolean
}

interface SegmentedControlItemProps {
	value: string
	className?: string
	children: React.ReactNode
	onClick?: () => void
	'data-active'?: boolean
}

function SegmentedControl({
	value,
	onValueChange,
	className,
	children,
	allActive = false,
	...props
}: SegmentedControlProps) {
	return (
		<div
			className={cn(
				'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
				className
			)}
			{...props}
		>
			{React.Children.map(children, (child, index) => {
				if (React.isValidElement<SegmentedControlItemProps>(child)) {
					const isActive = allActive || value === child.props.value
					const isFirst = index === 0
					const isLast = index === React.Children.count(children) - 1
					
					let roundedClasses = 'rounded-md'
					let shadowClasses = 'data-[active=true]:shadow-sm'
					
					if (allActive) {
						shadowClasses = '' // Remove shadow when all active
						if (isFirst) {
							roundedClasses = 'rounded-l-md rounded-r-none'
						} else if (isLast) {
							roundedClasses = 'rounded-r-md rounded-l-none'
						} else {
							roundedClasses = 'rounded-none'
						}
					}
					
					return React.cloneElement(child, {
						...child.props,
						onClick: () => {
							onValueChange?.(child.props.value)
							child.props.onClick?.()
						},
						className: cn(
							'cursor-pointer inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:outline-1 data-[active=true]:bg-background data-[active=true]:text-foreground dark:data-[active=true]:border-input dark:data-[active=true]:bg-input/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
							roundedClasses,
							shadowClasses,
							child.props.className
						),
						'data-active': isActive,
					})
				}
				return child
			})}
		</div>
	)
}

function SegmentedControlItem({
	children,
	className,
	...props
}: SegmentedControlItemProps) {
	return (
		<div className={className} {...props}>
			{children}
		</div>
	)
}

export { SegmentedControl, SegmentedControlItem }