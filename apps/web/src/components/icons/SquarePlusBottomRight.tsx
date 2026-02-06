import type { LucideProps } from 'lucide-react'
import { forwardRef } from 'react'

export const SquarePlusBottomRight = forwardRef<SVGSVGElement, LucideProps>(
	({ color = 'currentColor', size = 24, strokeWidth = 2, ...props }, ref) => (
		<svg
			fill='none'
			height={size}
			ref={ref}
			stroke={color}
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth={strokeWidth}
			viewBox='0 0 24 24'
			width={size}
			xmlns='http://www.w3.org/2000/svg'
			{...props}
		>
			{/* Square with bottom-right corner open */}
			<path d='M12 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7' />
			{/* Plus in bottom-right */}
			<path d='M15 18h6' />
			<path d='M18 15v6' />
		</svg>
	)
)

SquarePlusBottomRight.displayName = 'SquarePlusBottomRight'
